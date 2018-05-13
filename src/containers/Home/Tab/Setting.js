import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Redirect, Link } from 'react-router-dom';
import { withStyles } from 'material-ui/styles';
import List, { ListItem, ListItemText } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Card from 'material-ui/Card';
import RightIcon from 'material-ui-icons/KeyboardArrowRight';
import TextField from 'material-ui/TextField';
import { MenuItem } from 'material-ui/Menu';
import _map from 'lodash/map';
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

  handleChangeCurrent = (ev) => {
    this.props.wallet.changeCurrent(ev.target.value);
  }

  render() {
    const { requestLogout, logoutSuccess } = this.state;
    const { wallet, location } = this.props;
    const { accounts, currentIndex } = wallet;

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
                <TextField
                  id="select-account"
                  select
                  label="Current address"
                  value={currentIndex}
                  onChange={this.handleChangeCurrent}
                  helperText="Change address"
                  margin="normal"
                >
                  {_map(accounts, (x, i) => (
                    <MenuItem key={x[0]} value={i}>
                      Address_{i + 1} {x[0]}
                    </MenuItem>
                  ))}
                </TextField>
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
