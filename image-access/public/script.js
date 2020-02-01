var socket;
var currentPage;

function listAlbums() {
  console.log("here")
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
  var password = document.getElementById("auth-password").value;
  socket.emit("logon","password",password,function(result,token) {
    document.getElementById("auth-password").value = "";
    if ( result ) {
      localStorage.setItem("id",token.id);
      localStorage.setItem("token",token.token);
      listAlbums();
    } else {
      alert("Sorry, that password was incorrect. Please try again.");
    }
  });
}

function openPage(page) {
  Array.from(document.getElementsByClassName("page")).forEach(function(item) {
    item.style.display = (item.id == page + "-page" ? "inline" : "none");
  });
  currentPage = page;
}

function setupSockets() {
  socket = io();
  getAuthentication();
}

window.onload = setupSockets;
