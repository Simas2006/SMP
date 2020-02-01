var fs = require("fs");
var crypto = require("crypto");
var bcrypt = require("bcrypt");
var express = require("express");
var app = express();
var https = require("https");
var validPhotoExts = [".jpg",".png",".gif",".tiff"];
var PORT = process.argv[2] || 8000;
var PWD_HASH = "$2b$10$jZxwBx3nCWLhTGwXzJYOSe73dyhRLGIi/fd/ropB9SNj7kEoF9QEC";
var VALID_TOKENS = {};

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
  processIoFile();
});

var io = require("socket.io")(server);
io.on("connection",function(socket) {
  socket.authenticated = false;
  socket.on("logon",function(credType,credValue,callback) {
    if ( credType == "password" ) {
      bcrypt.compare(credValue,PWD_HASH,function(err,result) {
        if ( err ) throw err;
        if ( result ) {
          crypto.randomBytes(54,function(err,bytes) {
            if ( err ) throw err;
            var id = bytes.toString("base64");
            crypto.randomBytes(54,function(err,bytes) {
              if ( err ) throw err;
              var token = bytes.toString("base64");
              bcrypt.hash(token,10,function(err,tokenHash) {
                if ( err ) throw err;
                VALID_TOKENS[id] = tokenHash;
                callback(true,{id,token});
              });
            });
          });
        } else {
          callback(false);
        }
      });
    } else if ( credType == "token" ) {
      bcrypt.compare(credValue.token,VALID_TOKENS[credValue.id],function(err,result) {
        if ( result ) {
          socket.authenticated = true;
          callback(true);
        } else {
          callback(false);
        }
      });
    }
  });
  socket.on("list-albums",function(callback) {
    if ( ! socket.authenticated ) return;
    fs.readdir(`${__dirname}/../data/photos`,function(err,list) {
      if ( err ) throw err;
      callback(list.filter(item => ! item.startsWith(".")));
    });
  });
  socket.on("list-photos",function(album,callback) {
    if ( ! socket.authenticated ) return;
    if ( album.indexOf("..") > -1 ) return callback(null);
    fs.readdir(`${__dirname}/../data/photos/${album}`,function(err,list) {
      if ( err ) throw err;
      callback(list.filter(item => ! item.startsWith(".")).filter(item => validPhotoExts.filter(jtem => item.toLowerCase().endsWith(jtem)).length > 0));
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
      //io.sockets.emit("io-in-message",data.slice(2));
    });
  },250);
}
