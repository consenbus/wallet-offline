import React, { Component } from 'react';

export class Alert extends Component {
  state = {
    close: false,
  }

  render() {
    const { error } = this.props;

    return (
      <div>{error && error.message}</div>
    );
  }
}
