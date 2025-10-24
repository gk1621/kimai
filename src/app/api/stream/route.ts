export const runtime = 'edge';

export async function GET(request: Request) {
  const upgradeHeader = request.headers.get('upgrade') || '';
  if (upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  const { socket, response } = (globalThis as any).Deno.upgradeWebSocket(request);

  socket.onmessage = (event: MessageEvent) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : null;
      if (data && data.event === 'start') {
        socket.send(JSON.stringify({ event: 'connected' }));
      }
    } catch {
      // ignore
    }
  };
  socket.onclose = () => {};
  socket.onerror = () => {};

  return response;
}


