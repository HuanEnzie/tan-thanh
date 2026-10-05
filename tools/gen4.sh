#!/bin/bash
cd "$(dirname "$0")"
GEN="$HOME/.claude/skills/gpt-img/scripts/gen.mjs"
mkdir -p logs
run(){
  n=$1
  refs=$(python -c "import json;print(' '.join('--ref ../assets/raw/'+x+'.png' for x in json.load(open('gen4_refs.json'))['$n']))")
  for try in 1 2 3; do node "$GEN" --prompt-file "prompts/$n.txt" --out "../assets/raw/$n.png" $refs > "logs/$n.txt" 2>&1 && { echo "OK $n"; return; }; sleep 3; done
  echo "FAIL $n"
}
names=$(python -c "import json;print(' '.join(json.load(open('gen4_refs.json')).keys()))")
for n in $names; do
  [ -f "../assets/raw/$n.png" ] && { echo "SKIP $n"; continue; }
  run "$n" &
  while [ "$(jobs -rp | wc -l)" -ge 6 ]; do sleep 1; done
done
wait
echo ALLDONE
