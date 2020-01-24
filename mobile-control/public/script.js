var socket;

function setupSockets() {
  socket = io();
  socket.on("io-in-message",function(data) {
    console.log(data);
  });
}

window.onload = setupSockets;
