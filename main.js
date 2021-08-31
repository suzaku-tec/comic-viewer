"use strict";
const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");

const path = require("path");
const fs = require("fs");
const encoding = require("encoding-japanese");
const PDFDocument = require("pdfkit");
const imageSize = require("image-size");

let win = null;

const createWindow = () => {
  // windowを作成
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false, // is default value after Electron v5
      preload: path.join(__dirname, "preload.js"), // use a preload script
    },
  });
  // windowにindex.htmlを描画
  win.loadFile("index.html");
  // DevToolsを開く
  win.webContents.openDevTools();
};

var menu = Menu.buildFromTemplate([
  {
    label: "File",
    submenu: [
      { label: "load folder", click: loadFolder },
      { type: "separator" },
      { label: "export pdf", click: exportPdf },
      { label: "export zip" },
      { type: "separator" },
      { label: "Exit", click: onExit },
    ],
  },
]);

Menu.setApplicationMenu(menu);

// 初期化時にwindowを作成
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function onExit() {
  app.quit();
}

function loadFolder() {
  dialog.showOpenDialog({ properties: ["openDirectory"] }).then((res) => {
    if (!res.canceled) {
      var files = res.filePaths
        .map((filePath) => {
          return fs
            .readdirSync(filePath)
            .sort((fa, fb) => {
              const a1 = parseInt(fa.replace(/^\d*$/g, ""), 10);
              const b1 = parseInt(fb.replace(/^\d*$/g, ""), 10);
              const a2 = a1 !== a1 ? 0 : a1;
              const b2 = b1 !== b1 ? 0 : b1;

              if (a2 > b2) {
                return 1;
              } else if (a2 < b2) {
                return -1;
              }
              return 0;
            })
            .map((filename) => {
              return path.join(filePath, filename);
            });
        })
        .reduce((val1, val2) => {
          return val1.concat(val2);
        });

      win.webContents.send("openDirectory", files);
    }
  });
}

ipcMain.on("msg_render_to_main", (event, arg) => {
  console.log(arg); //printing "good job"
});

ipcMain.on("showMsg", (event, message) => {
  dialog.showMessageBox({
    type: "info",
    message: message,
  });
});

ipcMain.handle("exportPdf", async (event, files) => {
  if (!files) {
    return "error";
  }

  var parentDirName = path.dirname(files[0]).split(path.sep).pop();

  const filepath = dialog.showSaveDialogSync(win, {
    defaultPath: parentDirName,
    buttonLabel: "save",
    filters: [{ name: "PDF File", extensions: ["pdf"] }],
    properties: ["createDirectory"],
  });

  // キャンセルで閉じた場合
  if (filepath === undefined) {
    return { status: undefined };
  }

  try {
    const doc = new PDFDocument({
      autoFirstPage: false,
    });
    doc.pipe(fs.createWriteStream(filepath));
    files.forEach((file) => {
      const dimensions = imageSize(file);
      doc.addPage({
        size: [dimensions.width, dimensions.height],
      });

      doc.image(file, 0, 0, {
        width: dimensions.width,
      });
    });
    doc.end();
  } catch {
    if (fs.existsSync(filepath)) {
      fs.unlink(filepath, (err) => {
        if (err) throw err;
      });
    }
  }

  return filepath;
});

function exportPdf() {
  win.webContents.send("menuEvent-exportPdf");
}
