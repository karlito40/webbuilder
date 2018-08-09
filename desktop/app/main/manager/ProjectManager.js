import { promisify } from 'util';
import * as fs from 'fs';
import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import debounce from 'debounce';

const readdir = promisify(fs.readdir);
const lstat = promisify(fs.lstat);

export const Root = {
  _dir: null,
  _projects: null,

  async refresh() {
    const files = await readdir(this.getDir());
    const filesInfo = await Promise.all(files.map(async file => ({
      name: file,
      stat: await lstat(`${this.getDir()}/${file}`)
    })));
    this._projects = filesInfo.filter(info => info.stat.isDirectory())
      .map((info, i) => ({
        id: i,
        name: info.name,
        path: `${this.getDir()}/${info.name}`,
        lastAccess: info.stat.atime
      }));
  },

  entry(path) {
    this._dir = path;
    return this.refresh();
  },

  getDir() { return this._dir; },
  getConfigPath() { return `${this._dir}/config.json`; },
  getProjects() { return this._projects; },
};

export const Local = {
  _selectedProject: null,
  _watcher: null,
  events: new EventEmitter(),

  select(projectName) {
    this.exit();
    return this.open(projectName);
  },
  open(projectName) {
    const project = Root.getProjects().find(p => p.name === projectName);
    this._selectedProject = project;
    this._emit('open', this._selectedProject);
    return this._selectedProject;
  },
  watch(projectName) {
    this.select(projectName);

    const onChange = debounce(() => this._emit('update'), 20);
    const openAt = Date.now();

    this._watcher = chokidar.watch(this._selectedProject.path, { ignored: /node_modules/ });
    this._watcher.on('all', (event, path) => {
      if (event === 'unlinkDir' && path === this._selectedProject.path) {
        return this.exit();
      }

      if (Date.now() - openAt > 20000) {
        onChange();
      }
    });

    return this._selectedProject;
  },
  exit() {
    if (this._watcher) {
      this._watcher.close();
      this._watcher = null;
    }

    if (this._selectedProject) {
      this._emit('exit', this._selectedProject);
    }

    this._selected = null;
  },
  _emit(...args) {
    process.nextTick(() => this.events.emit(...args));
  }

};
