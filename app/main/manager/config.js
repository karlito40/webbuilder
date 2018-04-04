import { promisify } from 'util';
import * as fs from 'fs';
import { create as ForgeCreate } from 'forge-struct';

const readFile = promisify(fs.readFile);

const getters = {};
const setters = {};

(function() { // eslint-disable-line
  let configDir;
  let config;

  getters.getConfigDir = () => configDir;
  getters.getConfigFullPath = () => `${configDir}/config.json`;
  getters.getConfig = () => config;

  setters.setConfig = (v) => {
    config = v;
    return config;
  };

  setters.setConfigDir = (v) => {
    configDir = v;
    return configDir;
  };
})();

export function addProject(projectPath) {
  const config = getters.getConfig();
  config.projects.push(projectPath);
  return save(config);
}

export async function entry(path) { // eslint-disable-line
  if (getters.getConfigDir()) {
    console.log('error config entry cannot reassigne _configDir');
    return;
  }

  setters.setConfigDir(path);

  const configPath = getters.getConfigFullPath();
  try {
    console.log('read config file', configPath);
    const configJson = await readFile(configPath);
    console.log('parse config file');
    return setters.setConfig(JSON.parse(configJson));
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.log('error config entry', e);
      return false;
    }
  }

  console.log('await init config ...');
  const config = await initConfig();
  console.log('await init config done !');

  return config;
}

async function initConfig() {
  console.log('initialize config...');

  try {
    return await save({ projects: [] });
  } catch (e) {
    console.log('error config saved', e);
  }

  return false;
}

function save(config) {
  console.log('save config...');
  console.log('content', config);
  return ForgeCreate([
    { path: getters.getConfigFullPath(), content: JSON.stringify(config, null, 2) }
  ]).then(() => {
    console.log('config saved !');
    return setters.setConfig(config);
  });
}
