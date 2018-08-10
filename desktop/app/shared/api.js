import ipc from './ipc';

/**
 * Simple prototype
 * TODO: Manage dynamical route (params, query, placeholder [*])
 * Main ->
 *  Route.get('/projects', '../main/controllers/ProjectController@getAll')
 * Client ->
 *  fetch('GET', '/projects')
 */

let _controllerDir = './';

const Route = new Proxy({}, {
  get(obj, prop) {
    if (typeof window === 'undefined') {
      return mainHandler(prop);
    }
  }
});

export default {
  Route,
  setControllerDir(controllerDir) {
    _controllerDir = controllerDir;
  },
  fetch(method, uri, body = {}) {
    return ipc.service._fetchApi({ method, uri, body });
  }
};

function mainHandler(method) {
  const methods = ['POST', 'GET', 'DELETE', 'PUT', 'ALL'];
  const methodUp = method.toUpperCase();
  if (methods.indexOf(methodUp) === -1) {
    throw new Error('Method not settable');
  }

  const routeHandlers = [];
  ipc.expose('_fetchApi', (request) => {
    for (const handler of routeHandlers) {
      // TODO: format to handler (eg: param, query)
      if (handler.resource === request.uri) {
        return handler.callback(request);
      }
    }

    return {
      _error: {
        status: 404,
        message: 'Resource not found'
      }
    };
  });


  return (resource, actionString) => {
    const [controllerName, controllerMethod] = actionString.split('@');
    const Controller = require(`${_controllerDir}/${controllerName}Controller`); // eslint-disable-line

    routeHandlers.push({
      resource,
      callback: (request) => {
        const ctrl = new Controller(request);
        return ctrl[controllerMethod]();
      }
    });
  };
}
