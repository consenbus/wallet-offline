import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Redirect, Link } from 'react-router-dom';
import { withStyles } from 'material-ui/styles';
import List, { ListItem, ListItemText } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Card from 'material-ui/Card';
import RightIcon from 'material-ui-icons/KeyboardArrowRight';
import Layout from '../_Layout';
import Header from './_Header';
import Password from '../../../components/Password';

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
});

class Setting extends Component {
  state = {
    requestLogout: false,
    logoutSuccess: false,
  };

  requestLogout = () => {
    this.setState({ requestLogout: true });
  }

  clearTempData = () => {
    const { wallet } = this.props;
    wallet.clearTempData();
  }

  logout = (password) => {
    const { wallet } = this.props;
    wallet.logout(password);
    if (!wallet.error) this.setState({ logoutSuccess: true });
  }

  render() {
    const { requestLogout, logoutSuccess } = this.state;
    const { wallet, location } = this.props;

    return (
      <Layout active="setting">
        <Header title="Settings" />
        <div style={{ padding: 20 }}>
          {requestLogout && (
            <Password
              submit={this.logout}
              clearTempData={this.clearTempData}
              error={wallet.error}
            />
          )}
          {logoutSuccess && (
            <Redirect
              to={{
                pathname: '/guide',
                state: { from: location },
              }}
            />
          )}
          <Card>
            <List component="nav">
              <ListItem button>
                <ListItemText primary="Language" />
                <RightIcon />
              </ListItem>
              <ListItem button component={Link} to="/guide/write-down">
                <ListItemText primary="Backup wallet" />
                <RightIcon />
              </ListItem>
            </List>
            <Divider />
            <List component="nav">
              <ListItem button onClick={this.requestLogout}>
                <ListItemText primary="Security Preferences" secondary="Logout" />
              </ListItem>
            </List>
          </Card>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject('wallet')(observer(Setting)));
