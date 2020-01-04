var fs = require("fs");
var alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
var validMusicExts = [".mp3",".m4a",".wav",".ogg"];
var mplayer;

class MusicAgent {
  constructor() {
    this.audioObject = document.getElementById("audioObject");
    this.audioObject.onended = _ => this.playNextSong();
    this.active = false;
    this.currentlyPlaying = false;
    this.albumName = null;
    this.albumSongs = [];
    this.currentSongIndex = -1;
    this.volume = 100;
    this.savedVolume = -1;
    setInterval(_ => {
      this.updateTime();
    },100);
  }
  playNextSong() {
    if ( ! this.active ) return;
    this.currentSongIndex++;
    if ( this.currentSongIndex >= this.albumSongs.length ) {
      this.resetAll();
      return;
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
    this.togglePlay(true,false);
    this.active = false;
    this.albumName = null;
    this.albumSongs = [];
    this.currentSongIndex = 0;
    this.audioObject.src = "about:blank";
    document.getElementById("home-album-name").innerText = "Now Playing: Nothing!";
    document.getElementById("home-song-name").innerHTML = "&nbsp;";
  }
  setVolume(amount,change) {
    if ( ! change ) this.volume = amount;
    else this.volume += amount;
    this.volume = Math.max(Math.min(this.volume,100),0);
    this.audioObject.volume = this.volume / 100;
    if ( this.volume > 0 ) this.savedVolume = -1;
    document.getElementById("home-volume-button").innerText = `${this.volume}%`;
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
  }
  updateTime() {
    var pad = n => n < 10 ? "0" + n : n.toString();
    var currentTime = Math.floor(this.audioObject.currentTime || 0);
    var duration = this.audioObject.duration || 0;
    var timeLeft = Math.floor(duration - currentTime);
    document.getElementById("home-start-time").innerText = pad(Math.floor(currentTime / 60)) + ":" + pad(currentTime % 60);
    document.getElementById("home-end-time").innerText = "-" + pad(Math.floor(timeLeft / 60)) + ":" + pad(timeLeft % 60);
    document.getElementById("home-current-progress").style.width = `${(currentTime / duration) * 15}em`
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
            list = list.filter(item => ! item.startsWith(".")).filter(item => validMusicExts.filter(jtem => item.endsWith(jtem)).length > 0);
            mplayer.albumName = album;
            mplayer.albumSongs = list;
            mplayer.currentSongIndex = -1;
            mplayer.active = true;
            openPage("home");
            mplayer.playNextSong();
          });
        }
        albumObj.appendChild(button);
      }
    });
  }
}

function openPage(page) {
  Array.from(document.getElementsByClassName("page")).forEach(function(item) {
    item.style.display = item.id == page + "-page" ? "inline" : "none";
  });
  if ( page == "music" ) mplayer.renderSelectPage();
}

window.onload = function() {
  openPage("home");
  mplayer = new MusicAgent();
}
