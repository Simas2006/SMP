var fs = require("fs");
var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var PORT = process.argv[2] || 8000;

app.use("/public",express.static(__dirname + "/public"));

io.on("connection",function(socket) {
  socket.on("io-out-message",function(data) {
    fs.writeFile(`${__dirname}/io_file`,"s " + data,function(err) {
      if ( err ) throw err;
    });
  });
});

function processIoFile() {
  setInterval(function() {
    fs.readFile(`${__dirname}/io_file`,function(err,data) {
      if ( err ) throw err;
      data = data.toString();
      if ( ! data.startsWith("a ") ) return;
      fs.writeFile(`${__dirname}/io_file`,"",function(err) {
        if ( err ) throw err;
      });
      if ( data == "a exit" ) process.exit();
      io.sockets.emit("io-in-message",data.slice(2));
    });
  },250);
}

http.listen(PORT,function() {
  console.log("Listening on port " + PORT);
  processIoFile();
});
