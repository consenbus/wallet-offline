import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Redirect, Route } from 'react-router-dom';
import { withStyles } from 'material-ui/styles';
import styles from '../../styles/form';
import Password from '../../components/Password';

class CheckAccount extends Component {
  clearTempData = () => {
    const { wallet } = this.props;
    wallet.clearTempData();
  }

  signin = (password) => {
    const { wallet } = this.props;
    wallet.initialize(password);
  }

  render() {
    const {
      classes,
      wallet,
      component: ComponentSub,
      ...rest
    } = this.props;
    const { error, core } = wallet;

    const renderer = (props) => {
      if (wallet.isExists()) {
        if (core && core.exists()) {
          return <ComponentSub {...props} />;
        }
        return (
          <Password
            submit={this.signin}
            clearTempData={this.clearTempData}
            error={error}
          />
        );
      }

      return (
        <Redirect
          to={{
            pathname: '/guide',
            state: { from: props.location },
          }}
        />
      );
    };

    return <Route {...rest} render={renderer} />;
  }
}

export default withStyles(styles)(inject('wallet')(observer(CheckAccount)));
