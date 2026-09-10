// Minimal mock of the Gemini API for local end-to-end verification.
//   node test/mock-gemini.js [port]
// Then point the Worker at it with GEMINI_API_BASE=http://127.0.0.1:<port>/v1beta/models
import http from 'node:http';

const port = Number(process.argv[2] || 8788);

const REPLY = 'Hello from mock Gemini. Here is a grounded suggestion based on your project.';

const EXTRACTION = {
  contextPatch: {
    style: { directions: ['Japandi', 'Warm Minimal'] },
    notes: 'Mock extraction: customer prefers warm minimal, low-maintenance finishes.'
  },
  proposals: [
    {
      id: 'mock-b1',
      type: 'boq.add',
      rationale: 'Mock proposal for a living-room sofa.',
      payload: { room: 'room-living', category: 'Furniture', item: 'Mock 3-seater sofa', qty: 1, unit: 'nos', rate: 68000 }
    },
    {
      id: 'mock-r1',
      type: 'room.upsert',
      rationale: 'Mock room dimension from an uploaded plan.',
      payload: { id: 'room-living', name: 'Living Room', lengthM: 5.4, widthM: 3.9 }
    }
  ]
};

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => resolve(data));
  });
}

const server = http.createServer(async (req, res) => {
  await readBody(req);
  const url = req.url || '';
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (url.includes(':streamGenerateContent')) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' });
    const words = REPLY.split(' ');
    const chunks = [words.slice(0, 4).join(' ') + ' ', words.slice(4, 9).join(' ') + ' ', words.slice(9).join(' ')];
    let i = 0;
    const timer = setInterval(() => {
      if (i < chunks.length) {
        res.write('data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: chunks[i] }] } }] }) + '\n\n');
        i++;
      } else {
        res.write('data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: '' }] } }], usageMetadata: { totalTokenCount: 42 } }) + '\n\n');
        clearInterval(timer);
        res.end();
      }
    }, 25);
    return;
  }

  if (url.includes(':generateContent')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(EXTRACTION) }] } }],
      usageMetadata: { totalTokenCount: 77 }
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found', url }));
});

server.listen(port, '127.0.0.1', () => {
  console.log('mock-gemini listening on http://127.0.0.1:' + port);
});
