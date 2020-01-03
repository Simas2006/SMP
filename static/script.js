var fs = require("fs");
var alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
var mplayer;

class MusicPlayer {
  constructor() {
    this.audioObject = document.getElementById("audioObject");
    this.audioObject.onended = _ => this.playNextSong();
    this.active = true;
    this.currentlyPlaying = true;
    this.albumName = "Folder B";
    this.albumSongs = [
      "1-03 My Shot.m4a",
      "2-02 Cabinet Battle #1.m4a",
      "2-19 The Election of 1800.m4a"
    ];
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
    this.togglePlay(true);
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
  togglePlay(setState) {
    var nextState = ! this.currentlyPlaying;
    if ( setState ) nextState = true;
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
    var currentTime = this.audioObject.currentTime || 0;
    var duration = this.audioObject.duration || 0;
    document.getElementById("home-start-time").innerText = pad(Math.floor(currentTime / 60)) + ":" + pad(Math.floor(currentTime % 60));
    document.getElementById("home-end-time").innerText = pad(Math.floor(duration / 60)) + ":" + pad(Math.floor(duration % 60));
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
}

window.onload = function() {
  mplayer = new MusicPlayer();
}
