var fs = require("fs");
var bcrypt = require("bcrypt");

var authData = JSON.parse(fs.readFileSync(__dirname + "/auth.json").toString());
if ( process.argv[2] == "set_pwd" ) {
  bcrypt.hash(process.argv[3],10,function(err,hash) {
    if ( err ) throw err;
    authData.pwd_hash = hash;
    fs.writeFileSync(__dirname + "/auth.json",JSON.stringify(authData,null,2));
    console.log("Changed image-access password");
  });
} else if ( process.argv[2] == "clear_tokens" ) {
  authData.tokens = {}
  fs.writeFileSync(__dirname + "/auth.json",JSON.stringify(authData,null,2));
  console.log("Cleared image-access tokens");
}
