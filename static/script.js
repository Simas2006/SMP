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
    document.getElementById("home-song-name").innerText = `${songName} (${this.currentSongIndex + 1} in ${this.albumSongs.length})`;
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
}

window.onload = function() {
  mplayer = new MusicPlayer();
}
