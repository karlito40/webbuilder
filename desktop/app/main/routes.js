import path from 'path';
import { Route, setControllerDir } from '../shared/api';

setControllerDir(path.join(__dirname, 'controllers'));

function initialize() {
  Route.post('/projects', 'Project@getAll');
}

export default {
  initialize
};
