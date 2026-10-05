#!/bin/bash
cd "$(dirname "$0")"
GEN="$HOME/.claude/skills/gpt-img/scripts/gen.mjs"
mkdir -p logs ../assets/raw
run(){ n=$1; ref=$(python -c "import json;print(json.load(open('gen2_refs.json')).get('$n') or '')");
  args=(--prompt-file "prompts/$n.txt" --out "../assets/raw/$n.png"); [ -n "$ref" ] && args+=(--ref "../assets/raw/$ref.png");
  for try in 1 2 3; do node "$GEN" "${args[@]}" > "logs/$n.txt" 2>&1 && { echo "OK $n"; return; }; sleep 3; done; echo "FAIL $n"; }
names=$(python -c "import json;print(' '.join(json.load(open('gen2_refs.json')).keys()))")
for n in $names; do
  [ -f "../assets/raw/$n.png" ] && { echo "SKIP $n"; continue; }
  run "$n" &
  while [ "$(jobs -rp | wc -l)" -ge 6 ]; do sleep 1; done
done
wait; echo ALLDONE
