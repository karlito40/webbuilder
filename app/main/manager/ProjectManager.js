import { promisify } from 'util';
import * as fs from 'fs';
import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import debounce from 'debounce';

// import { create as ForgeCreate } from 'forge-struct';

// const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const lstat = promisify(fs.lstat);

export const Root = {
  _dir: null,
  _config: null,
  getDir() { return this._dir; },
  getConfigPath() { return `${this._dir}/config.json`; },
  getConfig() { return this._config; },
  setConfig(config) { this._config = config; },
  setConfigPath(path) { this._dir = path; },
  save(config) {
    return this.setConfig(config);
    // console.log('save config...');
    // console.log('content', config);
    // return ForgeCreate([
    //   { path: this.getConfigPath(), content: JSON.stringify(config, null, 2) }
    // ]).then(() => {
    //   console.log('config saved !');
    //   return this.setConfig(config);
    // });
  },
  // addProject(projectPath) {
  //   const config = this.getConfig();
  //   config.projects.push(projectPath);
  //   return this.save(config);
  // },
  async entry(path) {
    if (this.getDir()) {
      console.log('error config entry cannot reassigne _configDir');
      return;
    }

    this.setConfigPath(path);

    // try {
    //   console.log('read config file', this.getConfigPath());
    //   const configJson = await readFile(this.getConfigPath());
    //   console.log('parse config file');
    //   return this.setConfig(JSON.parse(configJson));
    // } catch (e) {
    //   if (e.code !== 'ENOENT') {
    //     console.log('error config entry', e);
    //     return false;
    //   }
    // }

    console.log('await init config ...');
    const config = await this.initConfig();
    console.log('await init config done !');

    return config;
  },
  async initConfig() {
    console.log('initialize config...');

    const files = await readdir(this.getDir());
    const filesInfo = await Promise.all(files.map(async file => ({
      name: file,
      stat: await lstat(`${this.getDir()}/${file}`)
    })));
    const projects = filesInfo.filter(info => info.stat.isDirectory())
      .map((info, i) => ({
        id: i,
        name: info.name,
        path: `${this.getDir()}/${info.name}`,
        lastAccess: info.stat.atime
      }));

    try {
      return this.save({ projects });
    } catch (e) {
      console.log('error config saved', e);
    }

    return false;
  }
};

export const Local = {
  _selectedProject: null,
  _watcher: null,
  listener: new EventEmitter(),

  select(projectName) {
    this.exit();
    return this.open(projectName);
  },
  open(projectName) {
    const project = Root.getConfig().projects.find(p => p.name === projectName);
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
    process.nextTick(() => this.listener.emit(...args));
  }

};
