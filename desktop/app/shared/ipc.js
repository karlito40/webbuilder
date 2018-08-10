/* eslint-disable */
import { ipcMain, ipcRenderer } from 'electron';
import { EventEmitter } from 'events';

const TIMEOUT = 5000;

export const main = {
  channels: {},
  expose(func) {
    if(typeof func != 'function') {
      throw new Error('Only function are exposable');
    }

    const channel = func.name;
    if(this.channels[channel]) {
      throw new Error('A function with same name is already defined');
    }

    this.channels[channel] = func;
    ipcMain.on(channel, (event, arg) => {
      const response = func(...arg.data);
      event.sender.send(createChannelResponse(channel, arg.messageId), response);
    })
  },
  link(win) {
    win.send('ipc.reconciliate', JSON.stringify(Object.keys(this.channels)));
  }
}

export const renderer = {
  _messageSent: 0,
  cmd: {},

  reconciliate() {
    return new Promise((resolve) => {
      ipcRenderer.once('ipc.reconciliate', (event, channelsJson) => {
        for(const channel of JSON.parse(channelsJson)) {
          this.add(channel);
        }
        resolve();
      });
    })
  },

  add(channel) {
    console.log(`renderer add ${channel}`);
    this.cmd[channel] = (...args) => {
      console.log(`renderer add ${channel}`, args);
      return this.send(channel, ...args);
    };
  },

  // call the main process
  send(channel, ...args) {
    const eventEmitter = new EventEmitter();
    const id = this._messageSent++;

    return new Promise((resolve, reject) => {
      const channelResponse = createChannelResponse(channel, id);
      const timeout = setTimeout(() => {
        ipcRenderer.removeListener(channelResponse, listener);
        reject(new Error('Request Timeout'))
      }, TIMEOUT);

      const listener = (event, arg) => {
        clearTimeout(timeout);
        resolve(arg)
      };

      ipcRenderer.once(channelResponse, listener);

      ipcRenderer.send(channel, {
        messageId: id,
        data: args
      });
    });

  },

}

function createChannelResponse(channel, id) {
  return `${channel}.response.${id}`;
}
