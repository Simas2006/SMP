var fs = require("fs");
var crypto = require("crypto");
var bcrypt = require("bcrypt");
var express = require("express");
var app = express();
var https = require("https");
var validPhotoExts = [".jpg",".png",".gif",".tiff"];
var PORT = process.argv[2] || 8000;
var PWD_HASH = "$2b$10$jZxwBx3nCWLhTGwXzJYOSe73dyhRLGIi/fd/ropB9SNj7kEoF9QEC";
var VALID_TOKENS = [
  "4020db4b1e0ee1dc8fd4d9772ed6e62a08bbdd940ba6a2aac824717f9c9dbbc948f5adba4d7252e40ca0aa3c7cd9e1bcd94df78e4096d3b20622732d0412734a5dd27e91f1acee1040d456c9bdd19a51ef09415363c387654fafca443da9255d5d114c986d86c8616162d5d99c05ebb032530ae0f3e6486812539bd921245c5d59cf2dc0c9dbe1ac7250a7708e8ac5beb0358186b17f348f172de750ed81f0caa9650ae410a7c8ec7490abef0cada9e587da3d068e93647bea546d5a9a02f2b318474477d92e71d678e145fe3468b08b32a42cba3dc0445f1706b37e3ba969bf0087a3b7cc7b0735ad841bfcbf81adf04b8470668be09a220e4bb816d250dcec"
];

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
  var authenticated = false;
  socket.on("logon",function(credType,credValue,callback) {
    if ( credType == "password" ) {
      bcrypt.compare(credValue,PWD_HASH,function(err,result) {
        if ( err ) throw err;
        if ( result ) {
          crypto.randomBytes(256,function(err,bytes) {
            if ( err ) throw err;
            var token = bytes.toString("hex");
            VALID_TOKENS.push(token);
            authenticated = true;
            callback(true,token);
          });
        } else {
          callback(false);
        }
      });
    } else if ( credType == "token" ) {
      if ( VALID_TOKENS.includes(credValue) ) {
        authenticated = true;
        callback(true);
      } else {
        callback(false);
      }
    }
  });
  socket.on("list-albums",function(callback) {
    if ( ! authenticated ) return;
    fs.readdir(`${__dirname}/../data/photos`,function(err,list) {
      if ( err ) throw err;
      callback(list.filter(item => ! item.startsWith(".")));
    });
  });
  socket.on("list-photos",function(album,callback) {
    if ( ! authenticated ) return;
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
      io.sockets.emit("io-in-message",data.slice(2));
    });
  },250);
}
