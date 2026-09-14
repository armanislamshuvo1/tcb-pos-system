// Centralized Server-Sent Events (SSE) broadcaster
const clients = new Set();

exports.addClient = (res) => {
  clients.add(res);
  res.on('close', () => {
    clients.delete(res);
  });
};

exports.broadcastUpdate = (eventType, data) => {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch (err) {
      clients.delete(client);
    }
  }
};

global.broadcastUpdate = exports.broadcastUpdate;
