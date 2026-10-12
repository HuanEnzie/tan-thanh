#!/bin/bash
# Round 21 art: generate every sheet and texture listed in tools/gen21_refs.json with gpt-img (at most 4 at a time).
#   bash tools/gen21.sh          generate (skips images already in assets/raw; delete one to regenerate it)
#   DRY=1 bash tools/gen21.sh    print the commands only, no API calls
# Run tools/make_prompts21.py first (writes prompts/ and gen21_refs.json, copies the style refs).
cd "$(dirname "$0")"
GEN="$HOME/.claude/skills/gpt-img/scripts/gen.mjs"
names=$(python -c "import json;print(' '.join(json.load(open('gen21_refs.json')).keys()))")
refs_of(){
  python -c "import json;print(' '.join('--ref ../assets/raw/'+x+'.png' for x in json.load(open('gen21_refs.json'))['$1']))"
}
if [ -n "$DRY" ]; then
  for n in $names; do
    if [ -f "../assets/raw/$n.png" ]; then echo "SKIP $n (exists)"; continue; fi
    echo "node \"$GEN\" --prompt-file \"prompts/$n.txt\" --out \"../assets/raw/$n.png\" $(refs_of "$n")"
  done
  exit 0
fi
mkdir -p logs
run(){
  n=$1
  refs=$(refs_of "$n")
  for try in 1 2 3; do node "$GEN" --prompt-file "prompts/$n.txt" --out "../assets/raw/$n.png" $refs > "logs/$n.txt" 2>&1 && { echo "OK $n"; return; }; sleep 3; done
  echo "FAIL $n"
}
for n in $names; do
  [ -f "../assets/raw/$n.png" ] && { echo "SKIP $n"; continue; }
  run "$n" &
  while [ "$(jobs -rp | wc -l)" -ge 4 ]; do sleep 1; done
done
wait
echo ALLDONE
