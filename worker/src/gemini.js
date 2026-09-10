// Gemini API integration: streaming prose (Flash) + structured extraction (Flash-Lite).
const DEFAULT_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// GEMINI_API_BASE lets tests point at a local mock. Never set it in production.
function apiBase(env) {
  return (env && env.GEMINI_API_BASE) || DEFAULT_API_BASE;
}

// Convert stored transcript + attachments into Gemini `contents`.
export function toGeminiContents(messages, attachments) {
  const list = Array.isArray(messages) ? messages : [];
  return list.map((m, i) => {
    const parts = [];
    if (m.content) parts.push({ text: String(m.content) });
    const isLastUser = i === list.length - 1 && m.role === 'user';
    if (isLastUser && Array.isArray(attachments)) {
      for (const a of attachments) {
        if (a && a.mime && a.data) {
          parts.push({ inlineData: { mimeType: a.mime, data: a.data } });
        }
      }
    }
    if (parts.length === 0) parts.push({ text: '' });
    return { role: m.role === 'assistant' ? 'model' : 'user', parts };
  });
}

export async function streamReply(env, systemInstruction, contents, onDelta) {
  const model = env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash';
  const url = `${apiBase(env)}/${model}:streamGenerateContent?alt=sse&key=${env.GEMINI_API_KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`gemini_stream_${res.status}: ${detail}`);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let full = '';
  let tokens = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const obj = JSON.parse(payload);
        const parts = obj?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
          for (const p of parts) {
            if (typeof p.text === 'string' && p.text) {
              full += p.text;
              onDelta(p.text);
            }
          }
        }
        if (obj?.usageMetadata?.totalTokenCount) tokens = obj.usageMetadata.totalTokenCount;
      } catch {
        // partial JSON across chunk boundary — ignore
      }
    }
  }
  return { text: full, tokens };
}

export async function extractStructured(env, prompt) {
  const model = env.GEMINI_LITE_MODEL || 'gemini-2.5-flash-lite';
  const url = `${apiBase(env)}/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      maxOutputTokens: 2048
    }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`gemini_extract_${res.status}: ${detail}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  const tokens = data?.usageMetadata?.totalTokenCount || 0;
  let parsed = {};
  try { parsed = JSON.parse(text); } catch { parsed = {}; }
  return { parsed, tokens };
}
