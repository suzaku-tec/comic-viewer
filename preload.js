const { contextBridge, ipcRenderer } = require("electron");
const encoding = require("encoding-japanese");

contextBridge.exposeInMainWorld("requires", {
  ipcRenderer: ipcRenderer,

  on: (channel, callback) =>
    ipcRenderer.on(channel, (event, argv) => callback(event, argv)),

  convertUnicode: (str) => {
    return encoding.convert(str, "UNICODE");
  },
});
