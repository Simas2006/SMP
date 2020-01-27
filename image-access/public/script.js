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
}

window.onload = setupSockets;
