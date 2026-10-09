#!/bin/bash
# runs every content15 prompt through the local GPT text endpoint, 5 jobs in parallel
cd "$(dirname "$0")"
ls content15/p_*.txt | sed 's#content15/p_##; s#\.txt##' | xargs -P 5 -I{} sh -c 'node gpt_text.mjs content15/p_{}.txt content15/{}.json >> content15/log.txt 2>&1'
echo finished >> content15/log.txt
