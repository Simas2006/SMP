var socket,currentPage,imageList,currentAlbum;
var loadedImages = [];
var imageStates = [];
var imageIndex = 0;
var renderPending = false;

function listAlbums() {
  openPage("loading");
  socket.emit("list-albums",function(albums) {
    var div = document.getElementById("album-div");
    for ( var i = 0; i < albums.length; i++ ) {
      var button = document.createElement("button");
      button.innerText = albums[i];
      button["data-album"] = albums[i];
      button.onclick = function() {
        var imageDiv = document.getElementById("viewer-image-div");
        if ( imageDiv.firstChild ) imageDiv.removeChild(imageDiv.firstChild);
        openAlbum(this["data-album"]);
        var sign = document.createElement("div");
        sign.id = "album-loading";
        sign.className = "loading-sign loading-sign-small";
        var hole = document.createElement("div");
        hole.className = "loading-sign-hole";
        sign.appendChild(hole);
        div.insertBefore(sign,this.nextSibling);
      }
      div.appendChild(button);
      div.appendChild(document.createElement("br"));
    }
    openPage("albums");
  });
}

function openAlbum(album) {
  currentAlbum = album;
  socket.emit("list-photos",album,function(list) {
    imageList = list;
    loadedImages = new Array(list.length).fill(null);
    imageStates = new Array(list.length).fill(0);
    imageIndex = 0;
    loadImageWithAuth(0,function() {
      openPage("viewer");
      renderImage(0);
      var albumLoading = document.getElementById("album-loading");
      albumLoading.parentElement.removeChild(albumLoading);
      loadImageWithAuth(1,Function.prototype);
      loadImageWithAuth(2,Function.prototype);
    });
  });
}

function renderImage() {
  if ( imageStates[imageIndex] == 1 ) {
    renderPending = true;
    setHidden("viewer-loading",false);
    return;
  } else {
    renderPending = false;
  }
  var image = loadedImages[imageIndex].cloneNode(true);
  document.getElementById("viewer-text").innerText = `${currentAlbum}\n${imageList[imageIndex]} (${imageIndex + 1} of ${imageList.length})`;
  document.getElementById("viewer-left-button").disabled = (imageIndex <= 0 ? "disabled" : "");
  document.getElementById("viewer-right-button").disabled = (imageIndex >= imageList.length - 1 ? "disabled" : "");
  EXIF.getData(image,function() {
    var rotatingOrientations = [5,6,7,8];
    var flippingOrientations = [2,4,5,7];
    var orientation = EXIF.getTag(this,"Orientation");
    var imageWidth = window.innerWidth - 30;
    var imageHeight = window.innerHeight - document.getElementById("viewer-menubar").clientHeight - 25;
    var ratio = image.height / image.width;
    if ( rotatingOrientations.includes(orientation) ) ratio = 1 / ratio;
    var useHeight = ratio * imageWidth > imageHeight;
    if ( ! rotatingOrientations.includes(orientation) ) {
      if ( useHeight ) image.height = imageHeight;
      else image.width = imageWidth;
    } else {
      if ( useHeight ) image.width = imageHeight;
      else image.height = imageWidth;
    }
    var transform = "";
    if ( rotatingOrientations.includes(orientation) ) {
      var degrees = [0,0,0,0,0,90,90,270,270];
      image.style.transformOrigin = "center";
      transform += `translateY(${(image.width - image.width / ratio) / 2}px) rotate(${degrees[orientation]}deg) `;
    }
    if ( flippingOrientations.includes(orientation) ) {
      var flipDirection = [null,null,"X","X","Y","Y",null,"Y",null];
      transform += `scale${flipDirection[orientation]}(-1) `;
    }
    if ( orientation == 3 ) transform += `rotate(180deg) `;
    image.style.transform = transform;
    var imageDiv = document.getElementById("viewer-image-div");
    if ( imageDiv.firstChild ) imageDiv.removeChild(imageDiv.firstChild);
    imageDiv.appendChild(image);
  });
}

function moveImage(move) {
  if ( renderPending ) return;
  if ( move > 1 || move < -1 ) return;
  if ( imageIndex + move < 0 || imageIndex + move >= imageList.length ) return;
  imageIndex += move;
  renderImage();
  if ( move == 1 ) {
    if ( imageIndex + 2 < loadedImages.length ) loadImageWithAuth(imageIndex + 2,Function.prototype);
    if ( imageIndex - 2 >= 0 ) loadedImages[imageIndex - 2] = null;
  } else if ( move == -1 ) {
    if ( imageIndex - 1 >= 0 ) loadImageWithAuth(imageIndex - 1,Function.prototype);
    if ( imageIndex + 3 <= loadedImages.length ) loadedImages[imageIndex + 3] = null;
  }
}

function loadImageWithAuth(index,callback) {
  imageStates[index] = 1;
  var req = new XMLHttpRequest();
  req.responseType = "blob";
  req.onload = function() {
    if ( req.status == 200 ) {
      var img = document.createElement("img");
      img.src = URL.createObjectURL(req.response);
      img.onload = function() {
        loadedImages[index] = img;
        imageStates[index] = 2;
        callback();
      }
    }
  }
  req.open("GET",`/photos/${encodeURIComponent(currentAlbum)}/${encodeURIComponent(imageList[index])}`);
  req.setRequestHeader("Authentication-ID",localStorage.getItem("id"));
  req.setRequestHeader("Authentication-Token",localStorage.getItem("token"));
  req.send();
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
  if ( page == "viewer" ) document.body.style.margin = "0px";
  else document.body.style.margin = "20px";
}

function setupSockets() {
  openPage("loading");
  socket = io();
  getAuthentication();
  setInterval(function() {
    if ( renderPending ) {
      if ( imageStates[imageIndex] == 2 ) {
        renderImage();
        setHidden("viewer-loading",true);
      }
    }
  },100);
}

window.onload = setupSockets;
