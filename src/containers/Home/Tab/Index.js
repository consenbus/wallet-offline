import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

import Card, { CardHeader } from 'material-ui/Card';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import Red from 'material-ui/colors/red';

import Layout from '../_Layout';
import Header from './_Header';
import AppSearch from '../../Explorer/_Search';
import HistoryList from '../Account/HistoryList';
import converter from '../../../utils/converter';

class Index extends Component {
  state = {
  }

  render() {
    const { wallet } = this.props;

    const {
      accounts, currentIndex, currentInfo, currentHistory,
    } = wallet;

    return (
      <Layout active="home">
        <Header />

        <Paper><AppSearch /></Paper>
        <div style={{ padding: 20 }}>
          <Card>
            <CardHeader
              action={
                <div
                  style={{
                    margin: '1rem',
                    fontSize: '2rem',
                    color: Red.A400,
                  }}
                >
                  {converter.unit(currentInfo.balance || '0', 'raw', 'BUS')}
                </div>
              }
              title={wallet.getName()}
            />
            <div className="ellipsis" style={{ margin: '1rem' }}>
              Address_{currentIndex + 1}: {accounts[currentIndex][0]}
            </div>
            <Divider />
            <HistoryList list={currentHistory} />
          </Card>
        </div>
      </Layout>
    );
  }
}

export default inject('wallet')(observer(Index));
