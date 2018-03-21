import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Redirect, Route } from 'react-router-dom';
import { CircularProgress } from 'material-ui/Progress';

class CheckAccount extends Component {
  componentWillMount() {
    this.props.account.loadAccounts().then(() => {
      this.props.account.accountInit();
    });
  }

  render() {
    const { component: ComponentSub, account, ...rest } = this.props;
    // NOTICE: keep `loading` outside of renderer
    const loading = account.loading;

    const renderer = (props) => {
      if (loading) {
        return (
          <div style={{ textAlign: 'center' }}>
            <CircularProgress />
          </div>
        );
      }

      if (account.hasAccounts()) {
        return <ComponentSub {...props} />;
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

export default inject('account')(observer(CheckAccount));
