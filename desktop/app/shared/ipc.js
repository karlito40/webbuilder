/* eslint-disable */
import { ipcMain, ipcRenderer } from 'electron';
import { EventEmitter } from 'events';

const TIMEOUT = 5000;

const mainProcess = {
  _store: new Map(),
  startListener() {
    if(this.hasStart) {
      return;
    }

    this.hasStart = true;

    ipcMain.on('_ipc.call', async (event, arg) => {
      const { cmdName, args, messageId } = arg;
      const func = this._store.get(cmdName);
      const response = (func)
        ? await func(...args)
        : { _error: { code: 'FUNCTION_NOT_FOUND'} };

      event.sender.send(createChannelResponse(cmdName, messageId), response);
    })
  },
  expose(cmdName, func) {
    if(typeof func != 'function') {
      throw new Error('Only function are exposable');
    }

    if(this._store.has(cmdName)) {
      throw new Error('A function with same name is already defined');
    }

    this._store.set(cmdName, func);
    this.startListener();
  }
}

const rendererProcess = {
  _messageSent: 0,
  send(cmdName, ...argsSent) {
    const eventEmitter = new EventEmitter();
    const id = this._messageSent++;

    console.log(`renderer send ${cmdName}`, argsSent);

    return new Promise((resolve, reject) => {
      const channelResponse = createChannelResponse(cmdName, id);
      const timeout = setTimeout(() => {
        ipcRenderer.removeListener(channelResponse, listener);
        reject(new Error('Request Timeout'))
      }, TIMEOUT);

      const listener = (event, arg) => {
        clearTimeout(timeout);
        resolve(arg)
      };

      ipcRenderer.once(channelResponse, listener);

      ipcRenderer.send('_ipc.call', {
        cmdName,
        messageId: id,
        args: argsSent
      });
    });

  },
}

rendererProcess.cmd = new Proxy(rendererProcess, {
  get(obj, prop) {
    return (...args) => {
      return obj.send(prop, ...args);
    };
  }
});


export default {
  renderer: ipcRenderer,
  main: ipcRenderer,
  service: rendererProcess.cmd,
  expose: mainProcess.expose.bind(mainProcess)
};

function createChannelResponse(channel, id) {
  return `${channel}.response.${id}`;
}
