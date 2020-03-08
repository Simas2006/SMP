var {app,BrowserWindow,globalShortcut,Menu} = require("electron");
var fs = require("fs");
var window;

function createWindow() {
  var size = require("electron").screen.getPrimaryDisplay().size;
  window = new BrowserWindow({
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true
    }
  });
  window.webContents.openDevTools();
  window.on("closed",function() {
    window = null;
  });
  window.loadURL(`file://${__dirname}/static/index.html`);
}

app.on("ready",createWindow);

app.on("window-all-closed",function() {
  app.quit();
});

app.on("activate",function() {
  if ( ! window ) createWindow();
});
