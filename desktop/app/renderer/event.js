import { ipcRenderer } from 'electron';
import { EventEmitter } from 'events';

let messageId = 0;

function callMain(channel, data = {}) {
  const eventEmitter = new EventEmitter();
  const id = messageId++;
  const channelResponse = `${channel}-reply`;

  const listener = (event, arg) => {
    if (arg.messageId === id) {
      eventEmitter.emit(arg.status, arg.data);
      if (arg.status === 'close') {
        ipcRenderer.removeListener(channelResponse, listener);
      }
    }
  };

  ipcRenderer.on(channelResponse, listener);

  ipcRenderer.send(channel, {
    messageId: id,
    data
  });

  return eventEmitter;
}

export function sendAsyncMessage() { // eslint-disable-line
  return callMain('asynchronous-message', {
    text: 'ping'
  });
}

export function sendProjectCreation(path) {
  return callMain('project-creation', {
    path
  });
}
