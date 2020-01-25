var socket;

function processIoFile(data) {
  console.log(data);
}

function sendMessage(message) {
  socket.emit("io-out-message",message);
}

function setupSockets() {
  socket = io();
  socket.on("io-in-message",function(data) {
    processIoFile(data);
  });
  socket.emit("io-out-message","ping");
}

window.onload = setupSockets;
