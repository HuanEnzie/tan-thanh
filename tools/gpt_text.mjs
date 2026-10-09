// usage: node gpt_text.mjs <prompt-file> <out-file> [model] — asks the local openai-oauth server for text (JSON is validated when out ends with .json)
import fs from 'fs';
const [pf, out, model = 'gpt-6-sol'] = process.argv.slice(2);
const prompt = fs.readFileSync(pf, 'utf8');
const base = process.env.GPT_IMG_BASE || 'http://127.0.0.1:10531/v1';
for (let attempt = 1; attempt <= 3; attempt++) {
  const body = { model, messages: [{ role: 'system', content: 'Bạn là biên kịch game giỏi, viết tiếng Việt tự nhiên, giàu hình ảnh. Chỉ trả về đúng định dạng được yêu cầu, không giải thích.' }, { role: 'user', content: prompt }] };
  const r = await fetch(base + '/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const t = await r.text();
  if (!r.ok) { console.error(out, 'HTTP', r.status, t.slice(0, 200)); continue; }
  let txt = JSON.parse(t).choices?.[0]?.message?.content ?? '';
  if (out.endsWith('.json')) {
    txt = txt.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try { JSON.parse(txt); } catch (e) { console.error(out, 'bad json, retry', attempt, e.message.slice(0, 80)); continue; }
  }
  fs.writeFileSync(out, txt, 'utf8');
  console.log('ok', out, txt.length);
  process.exit(0);
}
console.error('FAILED', out); process.exit(1);
