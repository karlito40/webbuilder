import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
import ipc from '../shared/ipc';
import api from '../shared/api';
import './app.global.css';

(async () => {
  // console.log('ipc.renderer.cmd', ipc.renderer.cmd);
  const result = await ipc.service.toto(666, 23);
  console.log('result', result);
  const result2 = await api.fetch('GET', '/projects');
  console.log('result2', result2);
  const result3 = await ipc.service.unknow(666, 23);
  console.log('result3', result3);
})();

const store = configureStore();

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/Root', () => {
    const NextRoot = require('./containers/Root'); // eslint-disable-line global-require
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
