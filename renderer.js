"use strict";

const ipcRenderer = window.requires.ipcRenderer;

var files = null;
var index = -1;

window.addEventListener("load", (event) => {
  iniEvent();

  // ipcRenderer.send("msg_render_to_main", "aaa");
  // ipcRenderer.send("exportPdf", files);

  window.requires.on("openDirectory", (event, filePaths) => {
    files = filePaths;

    if (files) {
      var imgWerapper = getImageWrapper();
      index = 0;
      imgWerapper.src = files[index];
      imgWerapper.alt = files[index];
    }
  });

  window.requires.on("menuEvent-exportPdf", () => {
    console.log(files);
    ipcRenderer.invoke("exportPdf", files).then((result) => {
      if (result) {
        ipcRenderer.send("showMsg", result + "に出力しました");
      }
    });
  });
});

function getImageWrapper() {
  return document.getElementById("imgWrapper");
}

function iniEvent() {
  getImageWrapper().addEventListener("click", () => {
    if (index < 0) {
      return;
    }

    nextPage();
  });

  getImageWrapper().oncontextmenu = () => {
    if (index < 1) {
      return;
    }

    previousPage();
  };

  getImageWrapper().addEventListener("keydown", (event) => {
    var keyName = event.key;

    if (keyName === "ArrowLeft") {
      previousPage();
    }

    if (keyName === "ArrowRight") {
      nextPage();
    }
  });
}

function nextPage() {
  index++;
  var imgWerapper = getImageWrapper();
  imgWerapper.src = files[index];
  imgWerapper.alt = files[index];
}

function previousPage() {
  index++;
  var imgWerapper = getImageWrapper();
  imgWerapper.src = files[index];
  imgWerapper.alt = files[index];
}
