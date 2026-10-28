// PDV Fácil - casca de aplicativo Windows que abre o sistema online.
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

// ====== CONFIGURAÇÃO (só mude aqui se o endereço do sistema mudar) ======
const APP_URL = 'https://caixa-encouraging-flow-pro.base44.app';
const APP_NAME = 'PDV Fácil';
// =========================================================================

const APP_HOST = new URL(APP_URL).hostname;

// Só deixa uma janela do app aberta por vez.
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow = null;

function isInternal(url) {
  try {
    const host = new URL(url).hostname;
    return (
      host === APP_HOST ||
      host.endsWith('.base44.app') ||
      host.endsWith('.base44.com') ||
      host === 'base44.com'
    );
  } catch (e) {
    return false;
  }
}

function offlinePage() {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
  <style>
    body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
      font-family:Segoe UI,Arial,sans-serif;background:#f4f7f5;color:#1f2d27;text-align:center}
    .box{max-width:420px;padding:32px}
    h1{font-size:24px;margin:0 0 8px}
    p{font-size:15px;color:#4a5a53;margin:0 0 24px}
    button{background:#16a34a;color:#fff;border:0;border-radius:8px;padding:12px 28px;
      font-size:15px;cursor:pointer}
    button:hover{background:#15803d}
  </style></head><body><div class="box">
    <h1>Sem conexão com a internet</h1>
    <p>O ${APP_NAME} precisa de internet para funcionar. Verifique sua conexão e tente novamente.</p>
    <button onclick="location.href='${APP_URL}'">Tentar novamente</button>
  </div></body></html>`;
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: APP_NAME,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setMenu(null);
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Mantém o nome do app na barra de título.
  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
    mainWindow.setTitle(APP_NAME);
  });

  // Links para outros sites abrem no navegador padrão.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isInternal(url)) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isInternal(url) && !url.startsWith('data:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Mostra tela amigável se estiver sem internet.
  mainWindow.webContents.on('did-fail-load', (event, code, desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3) {
      mainWindow.loadURL(offlinePage());
    }
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
