import * as ProjectManager from '../managers/ProjectManager';

export default class ProjectController {
  constructor() {
    console.log('new ProjectController()');
  }

  getAll() { // eslint-disable-line
    return ProjectManager.Root.getProjects();
  }
}
