/* eslint-disable */
import { ipcMain, ipcRenderer } from 'electron';
import { EventEmitter } from 'events';

const TIMEOUT = 5000;

const main = {
  cmd: {},
  expose(cmdName, func) {
    if(typeof func != 'function') {
      throw new Error('Only function are exposable');
    }

    if(this.cmd[cmdName]) {
      throw new Error('A function with same name is already defined');
    }

    this.cmd[cmdName] = func;
    ipcMain.on(cmdName, async (event, arg) => {
      const response = await func(...arg.data);
      event.sender.send(createChannelResponse(cmdName, arg.messageId), response);
    })
  }
};

const renderer = {
  _messageSent: 0,
  send(cmdName, ...args) {
    const eventEmitter = new EventEmitter();
    const id = this._messageSent++;

    console.log(`renderer send ${cmdName}`, args);

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

      ipcRenderer.send(cmdName, {
        messageId: id,
        data: args
      });
    });

  },
}

renderer.cmd = new Proxy(renderer, {
  get(obj, prop) {
    return (...args) => {
      return obj.send(prop, ...args);
    };
  }
});


export default {
  main,
  renderer,
  service: renderer.cmd,
  expose: main.expose.bind(main)
};

function createChannelResponse(channel, id) {
  return `${channel}.response.${id}`;
}
