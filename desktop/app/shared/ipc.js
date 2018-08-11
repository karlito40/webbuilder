import { ipcMain, ipcRenderer, BrowserWindow } from 'electron';

const TIMEOUT = 5000;
const isMain = (typeof window === 'undefined');
const ipc = isMain ? ipcMain : ipcRenderer;

const exposable = {
  _store: new Map(),
  startListener() {
    if (this.hasStart) {
      return;
    }

    this.hasStart = true;

    ipc.on('_ipc.call', async (event, arg) => {
      console.log('_ipc.call received', arg);
      const { cmdName, args, messageId } = arg;
      const func = this._store.get(cmdName);
      const response = (func)
        ? await func(...args)
        : { _error: { code: 'FUNCTION_NOT_FOUND' } };

      event.sender.send(createChannelResponse(cmdName, messageId), response);
    });
  },
  add(cmdName, func) {
    if (typeof func !== 'function') {
      throw new Error('Only function are exposable');
    }

    if (this._store.has(cmdName)) {
      throw new Error('A function with same name is already defined');
    }

    this._store.set(cmdName, func);
    this.startListener();
  }
};

const _service = {
  _messageSent: 0,
  send(cmdName, ...argsSent) {
    const id = this._messageSent++;
    const responses = [];

    return new Promise((resolve, reject) => {
      const targets = (isMain)
        ? BrowserWindow.getAllWindows().map(win => win.webContents)
        : [ipc];

      const timeout = setTimeout(() => {
        ipc.removeListener(channelResponse, listener);
        reject(new Error('Request Timeout'));
      }, TIMEOUT);

      const channelResponse = createChannelResponse(cmdName, id);
      const listener = (event, response) => {
        responses.push(response);

        // Just the first proper response need to be ok as the other should be identical.
        // It's only need for the main process.
        const ok = (
          typeof response !== 'object'
          || (response._error && response._error.code !== 'FUNCTION_NOT_FOUND')
        );

        if (ok || responses.length >= targets.length) {
          ipc.removeListener(channelResponse, listener);
          clearTimeout(timeout);

          resolve(response);
        }
      };

      ipc.on(channelResponse, listener);

      targets.forEach(target => {
        console.log(`service send ${cmdName}`, argsSent, id);

        target.send('_ipc.call', {
          cmdName,
          messageId: id,
          args: argsSent
        });
      });
    });
  },
};

_service.cmd = new Proxy(_service, {
  get(obj, prop) {
    return (...args) => obj.send(prop, ...args);
  }
});

export default {
  renderer: ipcRenderer,
  main: ipcMain,
  service: _service.cmd,
  expose: exposable.add.bind(exposable)
};

function createChannelResponse(channel, id) {
  return `${channel}.response.${id}`;
}
