var fs = require("fs");
var crypto = require("crypto");
var bcrypt = require("bcrypt");
var express = require("express");
var app = express();
var https = require("https");
var validPhotoExts = [".jpg",".png",".gif",".tiff"];
var PORT = process.argv[2] || 8000;

var sslOptions = {
  "key": fs.readFileSync(`${__dirname}/ssl/smp.pem`),
  "cert": fs.readFileSync(`${__dirname}/ssl/smp.crt`)
}
var authData = JSON.parse(fs.readFileSync(__dirname + "/auth.json").toString());

app.use("/public",express.static(__dirname + "/public"));

app.get("/",function(request,response) {
  response.redirect("/public");
});

var server = https.createServer(sslOptions,app);
server.listen(PORT,function() {
  console.log("Listening on port " + PORT);
  processIoFile();
});

app.use("/photos",function(request,response) {
  var id = request.header("Authentication-ID");
  var token = request.header("Authentication-Token");
  bcrypt.compare(token,authData.tokens[id] || "",function(err,result) {
    if ( err ) throw err;
    if ( result ) {
      response.status(200);
      fs.createReadStream(`${__dirname}/../data/photos/${decodeURIComponent(request.url)}`).pipe(response);
    } else {
      response.status(401);
      response.send("401 Not Authorized");
    }
  });
});

var io = require("socket.io")(server);
io.on("connection",function(socket) {
  socket.authenticated = false;
  socket.on("logon",function(credType,credValue,callback) {
    if ( credType == "password" ) {
      bcrypt.compare(credValue || "",authData.pwd_hash,function(err,result) {
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
                socket.authenticated = true;
                authData.tokens[id] = tokenHash;
                fs.writeFile(__dirname + "/auth.json",JSON.stringify(authData,null,2),function(err) {
                  if ( err ) throw err;
                });
                callback(true,{id,token});
              });
            });
          });
        } else {
          callback(false);
        }
      });
    } else if ( credType == "token" ) {
      credValue = credValue || {};
      bcrypt.compare(credValue.token || "",authData.tokens[credValue.id] || "",function(err,result) {
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
      list = list.filter(item => ! item.startsWith("."));
      fs.readFile(`${__dirname}/../data/photo_list.txt`,function(err,data) {
        if ( err ) throw err;
        var orderedList = data.toString().split("\n").filter(item => item);
        var removed = orderedList.filter(item => ! list.includes(item));
        orderedList = orderedList.filter(item => ! removed.includes(item));
        list = list.filter(item => ! orderedList.includes(item));
        orderedList = list.concat(orderedList);
        fs.writeFile(`${__dirname}/../data/photo_list.txt`,orderedList.join("\n"),function(err) {
          if ( err ) throw err;
        });
        callback(orderedList);
      });
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
