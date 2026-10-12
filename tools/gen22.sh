#!/bin/bash
# Round 22 art: generate every sheet and texture listed in tools/gen22_refs.json with gpt-img.
#   bash tools/gen22.sh          generate (skips images already in assets/raw; delete one to regenerate it)
#   DRY=1 bash tools/gen22.sh    print the commands only, no API calls
#   JOBS=3 bash tools/gen22.sh   at most 3 parallel jobs (default 4)
# Run tools/make_prompts22.py first (writes prompts/ and gen22_refs.json, copies the style refs).
#
# Server race (seen in round 21): every gen.mjs that finds openai-oauth down runs `npx openai-oauth --detach`, so
# parallel jobs started the server several times at once. Here the server is checked first; if it is down, ONE
# generation runs alone (that call starts it), and only then do the parallel jobs start, all with --no-start.
cd "$(dirname "$0")"
GEN="$HOME/.claude/skills/gpt-img/scripts/gen.mjs"
BASE="${GPT_IMG_BASE:-http://127.0.0.1:10531/v1}"
JOBS="${JOBS:-4}"
mkdir -p logs

names=$(python -c "import json;print(' '.join(json.load(open('gen22_refs.json')).keys()))") || exit 1
refs_of(){
  python -c "import json,sys;print(' '.join('--ref ../assets/raw/'+x+'.png' for x in json.load(open('gen22_refs.json'))[sys.argv[1]]))" "$1"
}
server_up(){
  GPT_BASE="$BASE" node -e "fetch(process.env.GPT_BASE+'/models',{signal:AbortSignal.timeout(4000)}).then(r=>process.exit(r.ok?0:1),()=>process.exit(1))" >/dev/null 2>&1
}
gen_one(){  # $1 = image name, $2 = "--no-start" or ""
  local n=$1 flag=$2 refs
  refs=$(refs_of "$n")
  node "$GEN" --prompt-file "prompts/$n.txt" --out "../assets/raw/$n.png" $refs $flag > "logs/$n.txt" 2>&1
}

todo=()
for n in $names; do
  if [ -f "../assets/raw/$n.png" ]; then echo "SKIP $n (exists)"; else todo+=("$n"); fi
done

if [ -n "$DRY" ]; then
  first=1
  for n in "${todo[@]}"; do
    flag="--no-start"; [ $first -eq 1 ] && flag="" && first=0
    echo "node \"$GEN\" --prompt-file \"prompts/$n.txt\" --out \"../assets/raw/$n.png\" $(refs_of "$n") $flag"
  done
  echo "DRY: ${#todo[@]} to generate (first line starts the server if it is down; the rest use --no-start)"
  exit 0
fi

if [ ${#todo[@]} -eq 0 ]; then echo ALLDONE; exit 0; fi

if ! server_up; then
  first=${todo[0]}
  echo "server down at $BASE: generating $first alone first (this starts openai-oauth)"
  ok=0
  for try in 1 2 3; do
    gen_one "$first" "" && [ -f "../assets/raw/$first.png" ] && { ok=1; break; }
    sleep 5
  done
  if [ $ok -ne 1 ]; then echo "FAIL $first: server did not start, see logs/$first.txt (login: npx openai-oauth login)"; exit 1; fi
  echo "OK $first (server is up now)"
  todo=("${todo[@]:1}")
else
  echo "server up at $BASE"
fi

fails=logs/failed22.txt
: > "$fails"
run(){
  local n=$1
  for try in 1 2 3; do
    gen_one "$n" "--no-start" && [ -f "../assets/raw/$n.png" ] && { echo "OK $n"; return 0; }
    sleep 8
  done
  echo "FAIL $n (see logs/$n.txt)"
  echo "$n" >> "$fails"
}
for n in "${todo[@]}"; do
  run "$n" &
  while [ "$(jobs -rp | wc -l)" -ge "$JOBS" ]; do sleep 1; done
done
wait
if [ -s "$fails" ]; then echo "FAILED: $(tr '\n' ' ' < "$fails")"; exit 1; fi
echo ALLDONE
