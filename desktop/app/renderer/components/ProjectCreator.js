// @flow
import React, { Component } from 'react';
// import { sendProjectCreation } from '../event';
import { sendProjectCreation } from '../event';

type Props = {};

export default class ProjectCreator extends Component<Props> {
  props: Props;
  constructor(props) {
    super(props);

    this.state = {
      projectOutputs: []
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async handleClick() {
    console.log('click submit');
    if (this.input.value && this.input.value.length) {
      console.log('this.input.value', this.input.value);
      sendProjectCreation(this.input.value).on('data', (data) => {
        console.log('output', data.text);
        this.setState({
          projectOutputs: [...this.state.projectOutputs, data.text]
        });
      });
    }
    // sendAsyncMessage().on('data', (result) => {
    //   console.log('result', result.text);
    // });
  }

  handleChange(e) { //eslint-disable-line
    console.log('e.target.value', e.target.value);
    // this.setState({value: e.target.value});
  }

  render() {
    const { projectOutputs } = this.state;

    return (
      <div className="project-creator">
        <h2>Nouveau projet...</h2>
        <div className="project-creator__form">
          <div className="form-group">
            <input
              ref={(node) => { this.input = node; }}
              type="text"
              value="/Users/martin/batcave/test-project-generator"
              onChange={this.handleChange}
              className="form-control"
            />
          </div>

          <button onClick={this.handleClick}>Create new project</button>
        </div>
        <div className="project-creator__output">
          {projectOutputs.map((output, id) => (
            <p key={id} style={{ fontSize: '12px' }}>{ output }</p>
          ))}
        </div>

      </div>
    );
  }
}
