/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow } from 'electron';
import { homedir } from 'os';
import MenuBuilder from './menu';
import * as Event from './event';
import * as ProjectManager from './managers/ProjectManager';
import * as PluginServer from './servers/plugin';
import ipc from '../shared/ipc';
import routes from './routes';

let mainWindow = null;

// process.on('unhandledRejection', (e) => {
//   console.error('tracing unhandledRejection: ');
//   console.error(e);
//   process.kill(1);
// });

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

// if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  const debug = require('electron-debug');
  debug();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
// }

const installExtensions = () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
    .catch(console.log);
};


/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  // if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  // }

  console.log('Manage config...');
  await ProjectManager.Root.entry(homedir() + '/.webbuilder');
  console.log('Manage done...');

  const pluginServer = await PluginServer.initialize();
  routes.initialize();

  ProjectManager.Local.events.on('open', (project) => {
    console.log('local project open ', project);
  }).on('update', () => {
    console.log('project change');
  });

  // ProjectManager.Local.watch('my-first-project');
  ProjectManager.Local.open('my-first-project');

  ipc.expose('toto', function(x, y) {
    return ProjectManager.Root.getProjects();
  });

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    // props for plugin issue
    // webSecurity: false
    // contextIsolation: true
  });

  let parentPath = __dirname.split('/');
  parentPath.pop();
  parentPath = parentPath.join('/');

  mainWindow.loadURL(`file://${parentPath}/renderer/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    setTimeout(async () => {
      const x = await ipc.service.fromRenderer();
      console.log('x', x);
    }, 1000)

    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
