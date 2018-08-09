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

    this.channels[channel] = func.toString();
    ipcMain.on(channel, (event, arg) => {
      console.log(`main on ${channel}`, arg);
      event.sender.send(createChannelResponse(channel, arg.messageId), callback());
    })
  },
  pipe(win) {
    win.send('ipc.reconciliate', JSON.stringify(this.channels));
  }
}

export const renderer = {
  _messageSent: 0,
  cmd: {},

  reconciliate() {
    return new Promise((resolve) => {
      ipcRenderer.once('ipc.reconciliate', (event, channelsEncoded) => {
        for(const [channel, funcString] of Object.entries(JSON.parse(channelsEncoded))) {
          this.cmd[channel] = eval(`(${funcString})`);
          this.cmd[channel](10, 20);
        }
        resolve();
      });
    })
  },

  add(channel) {
    console.log(`renderer add ${channel}`);
    this.cmd[channel] = (...args) => {
      console.log(`renderer add ${channel}`, args);
      return this.send(channel, args);
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
        args
      });
    });

  },

}

function createChannelResponse(channel, id) {
  return `${channel}.response.${id}`;
}
