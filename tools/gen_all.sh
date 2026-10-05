#!/bin/bash
# usage: gen_all.sh name1 name2 ... (runs 6 at a time)
cd "$(dirname "$0")"
GEN="$HOME/.claude/skills/gpt-img/scripts/gen.mjs"
run(){ n=$1; for try in 1 2; do node "$GEN" --prompt-file "prompts/$n.txt" --out "../assets/raw/$n.png" > "logs_$n.txt" 2>&1 && { echo "OK $n"; return; }; done; echo "FAIL $n"; }
mkdir -p logs
for n in "$@"; do
  run "$n" &
  while [ "$(jobs -rp | wc -l)" -ge 6 ]; do sleep 1; done
done
wait
echo ALLDONE
