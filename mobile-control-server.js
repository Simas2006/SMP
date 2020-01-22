var fs = require("fs");
var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var PORT = process.argv[2] || 8000;

app.use("/public",express.static(__dirname + "/mobile-control"));

io.on("connection",function(socket) {
  console.log("connection");
});

http.listen(PORT,function() {
  console.log("Listening on port " + PORT);
});
