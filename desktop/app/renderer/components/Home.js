// import Test from '/Users/martin/batcave/test/comp'; // disable-lint

// @flow
import React, { Component } from 'react';
// import { Link } from 'react-router-dom';
import styles from './Home.css';
import ProjectCreator from './ProjectCreator';


type Props = {};

export default class Home extends Component<Props> {
  props: Props;
  state = { AsyncComp: null, customEl: null };

  handleClick = async () => {
    console.log('handleClick()');
    // // const AsyncComp = await import('/Users/martin/batcave/test/AsyncComp');
    // const Comp = await import(path);
    // // console.log('AsyncComp', AsyncComp.default, AsyncComp.default())
    // this.setState({ AsyncComp: Comp.default });
    const s = document.createElement('script');
    const src = 'http://127.0.0.1:8081/src/my-element.js';
    s.setAttribute('src', src);
    s.setAttribute('type', 'module');
    s.onload = () => {
      console.log('module load');
      this.setState({ customEl: <my-element mood="happy" /> });
    };

    document.body.appendChild(s);
  }

  render() {
    const { AsyncComp, customEl } = this.state;
    console.log('render AsyncComp', AsyncComp);
    return (
      <div>
        {AsyncComp && <AsyncComp />}
        <button onClick={() => this.handleClick('/Users/martin/batcave/test/comp')}>Load async comp</button>

        {customEl}
        <div className={styles.container} data-tid="container">
          {/* <h2>Home</h2> */}
          {/* <Link to="/counter">to Counter</Link> */}
          {/* <iframe title="preview" srcDoc="<html><body>Hello, <b>world</b>.</body></html>" /> */}
          <ProjectCreator />
        </div>
      </div>
    );
  }
}
