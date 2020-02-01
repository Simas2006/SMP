var socket,currentPage;
var imageSlots = [null,null,null,null];

function listAlbums() {
  openPage("loading");
  socket.emit("list-albums",function(albums) {
    var div = document.getElementById("album-div");
    for ( var i = 0; i < albums.length; i++ ) {
      var button = document.createElement("button");
      button.innerText = albums[i];
      button["data-album"] = albums[i];
      button.onclick = function() {
        openAlbum(this["data-album"]);
      }
      div.appendChild(button);
    }
    openPage("albums");
  });
}

function openAlbum() {

}

function getAuthentication() {
  if ( localStorage.getItem("id") ) {
    socket.emit("logon","token",{
      "id": localStorage.getItem("id"),
      "token": localStorage.getItem("token")
    },function(result) {
      if ( result ) listAlbums();
      else openPage("auth");
    });
  } else {
    openPage("auth");
  }
}

function submitPassword() {
  setHidden("auth-loading",false);
  var password = document.getElementById("auth-password").value;
  console.log(password)
  socket.emit("logon","password",password,function(result,token) {
    document.getElementById("auth-password").value = "";
    setHidden("auth-loading",true);
    if ( result ) {
      localStorage.setItem("id",token.id);
      localStorage.setItem("token",token.token);
      listAlbums();
    } else {
      alert("Sorry, that password was incorrect. Please try again.");
    }
  });
}

function setHidden(id,state) {
  var el = document.getElementById(id);
  if ( state ) el.classList.add("hidden");
  else el.classList.remove("hidden");
}

function openPage(page) {
  Array.from(document.getElementsByClassName("page")).forEach(function(item) {
    item.style.display = (item.id == page + "-page" ? "inline" : "none");
  });
  currentPage = page;
}

function setupSockets() {
  openPage("loading");
  socket = io();
  getAuthentication();
}

window.onload = setupSockets;
