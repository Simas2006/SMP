var fs = require("fs");
var express = require("express");
var app = express();
var https = require("https");
var PORT = process.argv[2] || 8000;

var options = {
  "key": fs.readFileSync(`${__dirname}/ssl/smp.pem`),
  "cert": fs.readFileSync(`${__dirname}/ssl/smp.crt`)
}

app.use("/public",express.static(__dirname + "/public"));

app.get("/",function(request,response) {
  response.redirect("/public");
});

var server = https.createServer(options,app);
server.listen(PORT,function() {
  console.log("Listening on port " + PORT);
});

var io = require("socket.io")(server);
io.on("connection",function(socket) {
  socket.on("io-out-message",function(data) {
    fs.writeFile(`${__dirname}/io_file`,"s " + data,function(err) {
      if ( err ) throw err;
    });
  });
  socket.
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
