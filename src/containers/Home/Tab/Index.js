import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import Card, { CardHeader } from 'material-ui/Card';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import Red from 'material-ui/colors/red';
import Menu, { MenuItem } from 'material-ui/Menu';
import Button from 'material-ui/Button';
import _map from 'lodash/map';

import Layout from '../_Layout';
import Header from './_Header';
import AppSearch from '../../Explorer/_Search';
import HistoryList from '../Account/HistoryList';

class Index extends Component {
  state = {
    anchorEl: null,
  }

  handleClickListItem = (event) => {
    this.setState({ anchorEl: event.currentTarget });
  }

  handleMenuItemClick = (event, index) => {
    const { wallet } = this.props;
    wallet.changeCurrent(index);
    this.setState({ anchorEl: null });
  }

  handleClose = () => {
    this.setState({ anchorEl: null });
  }

  render() {
    const { wallet } = this.props;
    const { anchorEl } = this.state;

    const {
      accounts, currentIndex, currentBalance, currentHistory,
    } = wallet;

    const action = (
      <div
        style={{
          margin: '1rem',
          fontSize: '2rem',
          color: Red.A400,
        }}
      >
        {currentBalance}
      </div>
    );

    return (
      <Layout active="home">
        <Header />

        <Paper><AppSearch /></Paper>
        <div style={{ padding: 20 }}>
          <Card>
            <CardHeader
              action={action}
              title={wallet.getName()}
            />
            <div className="ellipsis" style={{ margin: '1rem' }}>
              <Button onClick={this.handleClickListItem}>Switch</Button>
              Address_{currentIndex + 1}: {accounts[currentIndex][0]}
            </div>
            <Menu
              id="switch-account"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={this.handleClose}
            >
              {_map(accounts, ([address], index) => (
                <MenuItem
                  key={address}
                  selected={index === currentIndex}
                  onClick={event => this.handleMenuItemClick(event, index)}
                >
                  Address_{index + 1} {address}
                </MenuItem>
              ))}
            </Menu>
            <Divider />
            <HistoryList list={currentHistory} />
          </Card>
        </div>
      </Layout>
    );
  }
}

export default inject('wallet')(observer(Index));
