const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { ExifTool } = require('exiftool-vendored');

const isDev = process.env.NODE_ENV !== 'production';
const exiftool = new ExifTool({ taskTimeoutMillis: 5000 });

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:9002');
    win.webContents.openDevTools();
  } else {
    // In production, load the exported Next.js app
    win.loadFile(path.join(__dirname, 'out', 'index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('save-metadata', async (event, filePath, metadata) => {
    try {
      if (!filePath) {
        throw new Error('File path is missing.');
      }
      
      // These tags map to standard IPTC/EXIF fields.
      const tags = {
        'ObjectName': metadata.title, // This is for the 'Title' field
        'Caption-Abstract': metadata.description, // This is for the 'Description' field
        'Keywords': metadata.keywords.split(',').map(k => k.trim()), // This is for 'Keywords'
        'Rating': metadata.rating, // This is for the star 'Rating'
      };

      await exiftool.write(filePath, tags, ['-overwrite_original']);

      return { success: true };
    } catch (err) {
      console.error('Failed to write metadata:', err);
      return { success: false, error: err.message };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  exiftool.end();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
