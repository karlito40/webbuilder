// @flow
import * as React from 'react';
// import { sendAsyncMessage } from '../event';

type Props = {
  children: React.Node
};

export default class App extends React.Component<Props> {
  props: Props;

  async componentDidMount() {
    // const result = await sendAsyncMessage();
    // console.log('result', result);
  }


  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}
