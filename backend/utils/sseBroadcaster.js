// Centralized Server-Sent Events (SSE) broadcaster with tenant scoping
const clients = new Set();

exports.addClient = (res, metadata = {}) => {
  const clientInfo = {
    res,
    companyId: metadata.companyId ? metadata.companyId.toString() : null,
    role: metadata.role || 'guest'
  };
  clients.add(clientInfo);
  res.on('close', () => {
    clients.delete(clientInfo);
  });
};

exports.broadcastUpdate = (eventType, data, targetCompanyId = null) => {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  const targetIdStr = targetCompanyId ? targetCompanyId.toString() : null;

  for (const client of clients) {
    try {
      // System admins see all events
      if (client.role === 'system_admin') {
        client.res.write(payload);
        continue;
      }
      // If targetCompanyId is specified, only send to matching company
      if (targetIdStr) {
        if (client.companyId === targetIdStr) {
          client.res.write(payload);
        }
      } else {
        // Untargeted / system events broadcast to all
        client.res.write(payload);
      }
    } catch (err) {
      clients.delete(client);
    }
  }
};

global.broadcastUpdate = exports.broadcastUpdate;
