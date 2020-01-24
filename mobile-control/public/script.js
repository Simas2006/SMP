var alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
var pad = n => n < 10 ? "0" + n : n.toString();
var socket;
var currentStatusObj = {};

function processIoFile(data) {
  console.log(data);
  data = data.split(" ");
  if ( data[0] == "status" ) {
    var obj = JSON.parse(data.slice(1).join(" "));
    currentStatusObj = obj;
    console.log(obj);
    if ( obj.active ) {
      var songName = obj.currentSong;
      for ( var i = 0; i < songName.length; i++ ) {
        if ( alphabet.includes(songName.charAt(0)) ) break;
        songName = songName.slice(1);
      }
      songName = songName.split(".").slice(0,-1).join(".");
      document.getElementById("album-name").innerText = `Now Playing: ${obj.albumName}`;
      document.getElementById("song-name").innerText = `${songName} (${obj.currentSongIndex + 1} of ${obj.albumLength})`;
    } else {
      document.getElementById("album-name").innerText = "Now Playing: Nothing!";
      document.getElementById("song-name").innerHTML = "&nbsp;";
      document.getElementById("current-progress").style.width = "0em";
    }
    document.getElementById("play-button").innerText = obj.currentlyPlaying ? "||" : "▶";
    var currentTime = Math.floor(obj.currentTime || 0);
    var timeLeft = Math.floor(obj.duration - currentTime);
    document.getElementById("start-time").innerText = pad(Math.floor(currentTime / 60)) + ":" + pad(currentTime % 60);
    document.getElementById("end-time").innerText = "-" + pad(Math.floor(timeLeft / 60)) + ":" + pad(timeLeft % 60);
    document.getElementById("current-progress").style.width = `${(currentTime / obj.duration) * 15}em`;
    document.getElementById("volume-button").innerText = `${obj.volume}%`;
    if ( obj.loopMode ) document.getElementById("loop-button").innerText = "Loops Forever";
    else document.getElementById("loop-button").innerText = "Plays Once";
  }
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
  setInterval(function() {
    if ( ! currentStatusObj.active ) return;
    currentStatusObj.currentTime += 0.01;
    var currentTime = Math.floor(currentStatusObj.currentTime || 0);
    var timeLeft = Math.floor(currentStatusObj.duration - currentTime);
    document.getElementById("start-time").innerText = pad(Math.floor(currentTime / 60)) + ":" + pad(currentTime % 60);
    document.getElementById("end-time").innerText = "-" + pad(Math.floor(timeLeft / 60)) + ":" + pad(timeLeft % 60);
    document.getElementById("current-progress").style.width = `${(currentTime / currentStatusObj.duration) * 15}em`;
  },10);
}

window.onload = setupSockets;
