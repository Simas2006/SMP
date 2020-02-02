var fs = require("fs");
var {spawn} = require("child_process");
var alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
var validMusicExts = [".mp3",".m4a",".wav",".ogg"];
var validPhotoExts = [".jpg",".png",".gif",".tiff"];
var magent,pagent,iagent;
var currentPage = "home";

class MusicAgent {
  constructor() {
    this.audioObject = document.getElementById("audioObject");
    this.audioObject.onended = _ => this.playNextSong();
    this.audioObject.oncanplaythrough = _ => iagent.updateStatus();
    this.active = false;
    this.currentlyPlaying = false;
    this.albumName = null;
    this.albumSongs = [];
    this.currentSongIndex = -1;
    this.volume = 100;
    this.savedVolume = -1;
    this.loopMode = false;
    setInterval(_ => {
      this.updateTime();
    },100);
  }
  playNextSong() {
    if ( ! this.active ) return;
    this.currentSongIndex++;
    if ( this.currentSongIndex >= this.albumSongs.length ) {
      if ( ! this.loopMode ) {
        this.resetAll();
        return;
      } else {
        this.currentSongIndex = 0;
      }
    }
    this.audioObject.src = `${__dirname}/../data/music/${encodeURIComponent(this.albumName)}/${encodeURIComponent(this.albumSongs[this.currentSongIndex])}`;
    this.togglePlay(true,true);
    var songName = this.albumSongs[this.currentSongIndex];
    for ( var i = 0; i < songName.length; i++ ) {
      if ( alphabet.includes(songName.charAt(0)) ) break;
      songName = songName.slice(1);
    }
    songName = songName.split(".").slice(0,-1).join(".");
    document.getElementById("home-album-name").innerText = `Now Playing: ${this.albumName}`;
    document.getElementById("home-song-name").innerText = `${songName} (${this.currentSongIndex + 1} of ${this.albumSongs.length})`;
  }
  resetAll() {
    iagent.ignoreUpdateStatus = true;
    this.togglePlay(true,false);
    this.active = false;
    this.albumName = null;
    this.albumSongs = [];
    this.currentSongIndex = 0;
    this.audioObject.src = "about:blank";
    document.getElementById("home-album-name").innerText = "Now Playing: Nothing!";
    document.getElementById("home-song-name").innerHTML = "&nbsp;";
    document.getElementById("home-current-progress").style.width = `0em`;
    iagent.ignoreUpdateStatus = false;
    iagent.updateStatus();
  }
  setVolume(amount,change) {
    if ( ! change ) this.volume = amount;
    else this.volume += amount;
    this.volume = Math.max(Math.min(this.volume,100),0);
    this.audioObject.volume = this.volume / 100;
    if ( this.volume > 0 ) this.savedVolume = -1;
    document.getElementById("home-volume-button").innerText = `${this.volume}%`;
    iagent.updateStatus();
  }
  togglePlay(setState,value) {
    if ( ! this.active ) return;
    var nextState = ! this.currentlyPlaying;
    if ( setState ) nextState = value;
    if ( nextState ) {
      document.getElementById("home-play-button").innerText = "||";
      this.audioObject.play();
    } else {
      document.getElementById("home-play-button").innerText = "▶";
      this.audioObject.pause();
    }
    this.currentlyPlaying = nextState;
    iagent.updateStatus();
  }
  updateTime() {
    var pad = n => n < 10 ? "0" + n : n.toString();
    var currentTime = Math.floor(this.audioObject.currentTime || 0);
    var duration = this.audioObject.duration || 0;
    var timeLeft = Math.floor(duration - currentTime);
    document.getElementById("home-start-time").innerText = pad(Math.floor(currentTime / 60)) + ":" + pad(currentTime % 60);
    document.getElementById("home-end-time").innerText = "-" + pad(Math.floor(timeLeft / 60)) + ":" + pad(timeLeft % 60);
    document.getElementById("home-current-progress").style.width = `${(currentTime / duration) * 15}em`;
  }
  muteButton() {
    if ( this.volume > 0 ) {
      this.savedVolume = this.volume;
      this.volume = 0;
    } else {
      if ( this.savedVolume == -1 ) return;
      this.volume = this.savedVolume;
      this.savedVolume = -1;
    }
    this.setVolume(0,true);
  }
  rewindSong() {
    this.audioObject.currentTime = 0;
  }
  switchLoopMode() {
    this.loopMode = ! this.loopMode;
    if ( this.loopMode ) document.getElementById("home-loop-button").innerText = "Loops Forever";
    else document.getElementById("home-loop-button").innerText = "Plays Once";
    iagent.updateStatus();
  }
  renderSelectPage() {
    fs.readdir(`${__dirname}/../data/music`,function(err,list) {
      if ( err ) throw err;
      list = list.filter(item => ! item.startsWith("."));
      var albumObj = document.getElementById("music-album-list");
      while ( albumObj.firstChild ) {
        albumObj.removeChild(albumObj.firstChild);
      }
      for ( var i = 0; i < list.length; i++ ) {
        var button = document.createElement("button");
        button.innerText = list[i];
        button["data-album"] = list[i];
        button.onclick = function() {
          var album = this["data-album"];
          fs.readdir(`${__dirname}/../data/music/${album}`,function(err,list) {
            list = list.filter(item => ! item.startsWith(".")).filter(item => validMusicExts.filter(jtem => item.toLowerCase().endsWith(jtem)).length > 0);
            magent.albumName = album;
            magent.albumSongs = list;
            magent.currentSongIndex = -1;
            magent.active = true;
            openPage("home");
            magent.playNextSong();
          });
        }
        albumObj.appendChild(button);
      }
    });
  }
}

class PhotoAgent {
  constructor() {
    this.albumName = null;
    this.albumImages = [];
    this.currentImageIndex = 0;
  }
  renderImage() {
    document.getElementById("photo-viewer-text").innerText = `Album: ${this.albumName}\n${this.albumImages[this.currentImageIndex]} (${this.currentImageIndex + 1} of ${this.albumImages.length})`
    var image = new Image();
    image.src = `${__dirname}/../data/photos/${encodeURIComponent(this.albumName)}/${encodeURIComponent(this.albumImages[this.currentImageIndex])}`;
    image.onload = function() {
      EXIF.getData(image,function() {
        var rotatingOrientations = [5,6,7,8];
        var flippingOrientations = [2,4,5,7];
        var orientation = EXIF.getTag(this,"Orientation");
        var imageWidth = window.innerWidth - 30;
        var imageHeight = window.innerHeight - document.getElementById("photo-viewer-menubar").clientHeight - 25;
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
        var imageDiv = document.getElementById("photo-viewer-image-div");
        if ( imageDiv.firstChild ) imageDiv.removeChild(imageDiv.firstChild);
        imageDiv.appendChild(image);
      });
    }
  }
  moveImage(move) {
    this.currentImageIndex += move;
    this.currentImageIndex = Math.max(Math.min(this.currentImageIndex,this.albumImages.length - 1),0);
    this.renderImage();
  }
  renderSelectPage() {
    fs.readdir(`${__dirname}/../data/photos`,function(err,list) {
      if ( err ) throw err;
      list = list.filter(item => ! item.startsWith("."));
      var albumObj = document.getElementById("photo-select-album-list");
      while ( albumObj.firstChild ) {
        albumObj.removeChild(albumObj.firstChild);
      }
      for ( var i = 0; i < list.length; i++ ) {
        var button = document.createElement("button");
        button.innerText = list[i];
        button["data-album"] = list[i];
        button.onclick = function() {
          var album = this["data-album"];
          fs.readdir(`${__dirname}/../data/photos/${album}`,function(err,list) {
            list = list.filter(item => ! item.startsWith(".")).filter(item => validPhotoExts.filter(jtem => item.toLowerCase().endsWith(jtem)).length > 0);
            pagent.albumName = album;
            pagent.albumImages = list;
            pagent.currentImageIndex = 0;
            var imageDiv = document.getElementById("photo-viewer-image-div");
            if ( imageDiv.firstChild ) imageDiv.removeChild(imageDiv.firstChild);
            openPage("photo-viewer");
            pagent.renderImage();
          });
        }
        albumObj.appendChild(button);
      }
    });
  }
}

class InternetAgent {
  constructor() {
    this.serverSlots = [null,null];
    this.ignoreUpdateStatus = false;
    this.config = null;
    fs.readFile(`${__dirname}/../config.json`,(err,data) => {
      if ( err ) throw err;
      this.config = JSON.parse(data.toString());
      console.log(this.config)
      if ( this.config.mobileControlStart ) {
        this.startServer({
          "path": `${__dirname}/../mobile-control/server.js`,
          "port": this.config.mobileControlPort,
          "ioFile": `${__dirname}/../mobile-control/io_file`
        },0);
      }
    });
  }
  startServer(obj,index) {
    var proc = spawn("node",[obj.path,obj.port]);
    proc.stdout.on("data",function(data) {
      console.log(`SERVER #${index}: ${data}`);
    });
    proc.stderr.on("data",function(data) {
      console.log(`SERVER #${index}: ${data}`);
    });
    proc.on("close",function(code) {
      console.log(`SERVER #${index} closed with code ${code}`);
    });
    this.serverSlots[index] = {
      "path": obj.path,
      "port": obj.port,
      "ioFile": obj.ioFile,
      "interval": this.processIoFile(index),
      proc
    };
  }
  processIoFile(index) {
    return setInterval(_ => {
      fs.readFile(this.serverSlots[index].ioFile,(err,data) => {
        if ( err ) throw err;
        data = data.toString();
        if ( ! data.startsWith("s ") ) return;
        data = data.slice(2);
        fs.writeFile(this.serverSlots[index].ioFile,"",err => {
          if ( err ) throw err;
          if ( index == 0 ) this.processMobileControl(data);
          else if ( index == 1 ) this.processImageAccess(data);
        });
      });
    },250);
  }
  processMobileControl(data) {
    data = data.split(" ");
    if ( data[0] == "ping" ) {
      this.writeToIoFile(0,"status " + JSON.stringify(this.getMusicStatus()),Function.prototype);
    } else if ( data[0] == "toggleplay" ) {
      magent.togglePlay();
    } else if ( data[0] == "pns" ) {
      magent.playNextSong();
    } else if ( data[0] == "rewind" ) {
      magent.rewindSong();
    } else if ( data[0] == "vchange" ) {
      magent.setVolume(parseInt(data[1]),true);
    } else if ( data[0] == "mute" ) {
      magent.muteButton();
    } else if ( data[0] == "toggleloopmode" ) {
      magent.switchLoopMode();
    } else if ( data[0] == "clear" ) {
      magent.resetAll();
    }
  }
  processImageAccess(data) {
    console.log(data);
  }
  updateStatus() {
    if ( this.ignoreUpdateStatus ) return;
    if ( this.serverSlots[0] ) {
      this.writeToIoFile(0,"status " + JSON.stringify(this.getMusicStatus()),Function.prototype);
    }
  }
  getMusicStatus() {
    return {
      "active": magent.active,
      "currentlyPlaying": magent.currentlyPlaying,
      "albumName": magent.albumName,
      "currentSong": magent.albumSongs[magent.currentSongIndex],
      "currentSongIndex": magent.currentSongIndex,
      "albumLength": magent.albumSongs.length,
      "volume": magent.volume,
      "loopMode": magent.loopMode,
      "currentTime": magent.audioObject.currentTime,
      "duration": magent.audioObject.duration || 0
    }
  }
  writeToIoFile(index,msg,callback) {
    fs.writeFile(this.serverSlots[index].ioFile,"a " + msg,err => {
      if ( err ) throw err;
      callback();
    });
  }
  stopServer(index,callback) {
    this.writeToIoFile(index,"exit",_ => {
      clearInterval(this.serverSlots[index].interval);
      callback();
    });
  }
  stopAllServers(callback,index) {
    if ( ! index ) index = 0;
    if ( ! callback ) callback = Function.prototype;
    if ( this.serverSlots[index] ) {
      this.stopServer(index,_ => {
        if ( index + 1 >= this.serverSlots.length ) callback();
        else this.stopAllServers(callback,index + 1);
      });
    } else {
      if ( index + 1 >= this.serverSlots.length ) callback();
      else this.stopAllServers(callback,index + 1);
    }
  }
}

function openPage(page) {
  Array.from(document.getElementsByClassName("page")).forEach(function(item) {
    item.style.display = (item.id == page + "-page" ? "inline" : "none");
  });
  currentPage = page;
  if ( page == "music" ) magent.renderSelectPage();
  else if ( page == "photo-select" ) pagent.renderSelectPage();
}

window.onkeydown = function(event) {
  if ( currentPage == "photo-viewer" ) {
    if ( event.code == "ArrowLeft" ) pagent.moveImage(-1);
    else if ( event.code == "ArrowRight" ) pagent.moveImage(1);
  }
}

window.onload = function() {
  magent = new MusicAgent();
  pagent = new PhotoAgent();
  iagent = new InternetAgent();
  window.onbeforeunload = function() {
    iagent.stopAllServers();
    return null;
  }
  openPage("home");
}
