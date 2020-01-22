var socket;

function setupSockets() {
  socket = io();
  socket.on("get-music-status",function(status) {
    console.log(status);
  });
}

window.onload = setupSockets;
