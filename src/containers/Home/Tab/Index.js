import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import { withStyles } from 'material-ui/styles';

import List, { ListItem, ListItemText } from 'material-ui/List';
import Card, { CardHeader } from 'material-ui/Card';
import IconButton from 'material-ui/IconButton';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import Avatar from 'material-ui/Avatar';
import AddIcon from 'material-ui-icons/Add';
import WalletIcon from 'material-ui-icons/AccountBalanceWallet';
import _map from 'lodash/map';

import Layout from '../_Layout';
import Header from './_Header';
import AppSearch from '../../Explorer/_Search';

const styles = {
  search: {
  },
};

class Index extends Component {
  render() {
    const { account, classes } = this.props;
    const accounts = account.accounts;

    const action = (
      <IconButton component={Link} to="/account/new">
        <AddIcon />
      </IconButton>
    );

    return (
      <Layout active="home">
        <Header />

        <div className={classes.search}>
          <Paper><AppSearch /></Paper>
        </div>
        <div style={{ padding: 20 }}>
          <Card>
            <CardHeader
              action={action}
              title="My account"
              subheader={`Total ${accounts.length || 0} account`}
            />
            <Divider />

            <List>
              {_map(accounts, a => (
                <ListItem
                  key={a.account}
                  component={Link}
                  to={`/accounts/${a.account || 'null'}`}
                >
                  <Avatar>
                    <WalletIcon />
                  </Avatar>
                  <ListItemText
                    style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}
                    primary={a.name || 'Default account'}
                    secondary={a.account}
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject('account')(observer(Index)));
