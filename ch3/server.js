const { v4: uuidv4 } = require("uuid");
var clients = [],
  WebSocket = require("ws"),
  WebSocketServer = WebSocket.Server,
  wss = new WebSocketServer({ port: 8181 });

function wsSend(type, id, nickname, message) {
  for (var i = 0; i < clients.length; i++) {
    var clientSocket = clients[i].ws;
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({ type, id, nickname, message }));
    }
  }
}

var clientIndex = 1;

wss.on("connection", function (ws) {
  const id = uuidv4();
  var nickname = "user-" + clientIndex;
  clientIndex++;
  clients.push({ id, ws, nickname });
  console.log("client [%s] connected", id);
  var connect_message = nickname + " has connected.";
  wsSend("notification", id, nickname, connect_message);

  ws.on("message", function (message) {
    if (message.indexOf("/nick") == 0) {
      var nickname_array = message.split(" ");
      if (nickname_array.length >= 2) {
        var old_nickname = nickname;
        nickname = nickname_array[1];
        nickname_message = `Client ${old_nickname} changed to ${nickname}`;
        wsSend("nick_update", id, nickname, nickname_message);
      }
    } else {
      wsSend("message", id, nickname, message);
    }
  });

  var closeSocket = function (customMessage) {
    for (var i = 0; i < clients.length; i++) {
      if (clients[i].id === id) {
        var disconnect_message;
        if (customMessage) {
          disconnect_message = customMessage;
        } else {
          disconnect_message = nickname + " has disconnected.";
        }
        wsSend("notification", id, nickname, disconnect_message);
        clients.splice(i, 1);
      }
    }
  };
  ws.on("close", () => closeSocket());
  process.on("SIGINT", function () {
    console.log("closing things");
    closeSocket("Serve has disconnected.");
    process.exit();
  });
});
