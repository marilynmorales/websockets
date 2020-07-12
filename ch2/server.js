const { v4: uuidv4 } = require("uuid");
var clients = [],
  WebSocketServer = require("ws").Server,
  wss = new WebSocketServer({ port: 8181 });

wss.on("connection", function (ws) {
  const id = uuidv4();
  clients.push({ id, ws });
  console.log("client [%s] connected", id);
  ws.on("close", function () {
    for (var i = 0; i < clients.length; i++) {
      if (clients[i].id === id) {
        console.log("client [%s] disconnected", id);
        clients.splice(i, 1);
      }
    }
  });
  ws.on("message", function (message) {
    for (var i = 0; i < clients.length; i++) {
      var clientSocket = clients[i].ws;
      if (clientSocket.readyState === ws.OPEN) {
        console.log("client [%s]: %s", clients[i].id, message);
        clientSocket.send(
          JSON.stringify({
            id,
            message,
          })
        );
      }
    }
  });
});
