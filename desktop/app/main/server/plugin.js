import express from 'express';
import cors from 'cors';
import http from 'http';
import portscanner from 'portscanner';
import { Root } from '../manager/ProjectManager';

let server;


export async function boot() {
  console.log('starting plugin server...');
  const app = express();

  app.use(express.static(Root.getDir()));
  app.use(cors());

  // Non-privileged user can't open a listening socket on ports below 1024.
  server = await createAvailableServer(app, 1024, 9000);
  console.log(`plugin server listening on port ${server.address().port} !`);

  return server;
}

export function getPort() {
  return server.address().port;
}


function createAvailableServer(app, fromPort, toPort) {
  let port;
  return new Promise(async (resolve, reject) => {
    port = await portscanner.findAPortNotInUse(fromPort, toPort, '127.0.0.1');

    const checkServer = http.createServer(app);
    checkServer.once('error', reject);

    console.log('plugin server checking port', port);
    checkServer.listen(port, () => resolve(checkServer));
  })
    .catch(e => {
      console.log(e);
      const hasNoPermission = (e.code === 'EACCES');
      if (hasNoPermission && port < toPort) {
        console.log(`plugin server port ${port} denied, moving to the next one`);
        return createAvailableServer(app, port + 1, toPort);
      }

      if (hasNoPermission) {
        console.log('plugin server no ports available');
        return null;
      }

      return new Promise((resolve, reject) => reject(e));
    });
}
