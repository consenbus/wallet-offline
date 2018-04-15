import React from 'react';
import _isEmpty from 'lodash/isEmpty';
import Grid from 'material-ui/Grid';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';

import { withStyles } from 'material-ui/styles';
import pink from 'material-ui/colors/pink';
import green from 'material-ui/colors/green';

import { LinearProgress } from 'material-ui/Progress';

import RegularCard from '../../components/Cards/RegularCard';
import ItemGrid from '../../components/Grid/ItemGrid';
import Table from '../../components/Table/Table';
import converter from '../../utils/converter';
import { hex2dec } from '../../utils/wallet/functions';

import Layout from '../Home/_Layout';
import Header from '../Home/Tab/_Header';
import rpc from '../../utils/rpc';

const styles = {
  avatar: {},
  pinkAvatar: {
    color: '#fff',
    backgroundColor: pink[500],
    marginRight: '10px',
  },
  greenAvatar: {
    color: '#fff',
    backgroundColor: green[500],
    marginRight: '10px',
  },
  error: {
    border: '1px solid #ffa39e',
    backgroundColor: '#fff1f0',
    padding: '5px',
    margin: '10px',
  },
};

const getTableData = (block) => {
  if (_isEmpty(block)) {
    return [];
  }

  const {
    hash, type, account, balance, destination, amount, source, previous, work, signature,
  } = block;

  const data = [
    ['Hash', <code>{hash}</code>],
    ['Type', <code>{type}</code>],
  ];

  if (account) data.push(['Account', account]);
  if (balance) data.push(['Balance', `${converter.unit(hex2dec(balance || 0), 'raw', 'BUS')} BUS`]);
  if (destination) data.push(['Destination', destination]);
  if (amount) data.push(['Amount', `${converter.unit(amount || 0, 'raw', 'BUS')} BUS`]);
  if (source) data.push(['Source', block.source]);
  if (previous) data.push(['Previous', <Link to={`/explorer/blocks/${previous}`}>{previous}</Link>]);
  data.push(['Work', <code>{work}</code>]);
  data.push(['Signature', <code>{signature}</code>]);

  return data;
};

class Show extends React.Component {
  state = {
    block: null, // current select block detail from rpc
    loading: false, // get block detail from rpc process
    error: null, // error message at get block detail from rpc process
  }

  componentWillMount() {
    const hash = this.props.match.params.hash;
    this.getBlockData(hash);
  }

  async getBlockData(hash) {
    this.setState({
      block: null,
      loading: true,
      error: null,
    });
    try {
      const { data } = await rpc.post('/', {
        action: 'blocks_info',
        hashes: [hash],
      });
      const info = data.blocks[hash];
      this.setState({
        block: Object.assign({
          hash,
          account: info.block_account,
          amount: info.amount,
        }, JSON.parse(info.contents)),
        error: null,
        loading: false,
      });
    } catch (error) {
      this.setState({
        loading: false,
        error,
      });
    }
  }

  render() {
    const { classes } = this.props;
    const { loading, error, block } = this.state;
    const tableData = getTableData(block);

    return (
      <Layout active="">
        <Header title="Chain explorer" />
        <Grid container>
          {loading && <LinearProgress />}
          {error && <div className={classes.error}>{error.message}</div>}
          {!loading && !error && block && (
            <ItemGrid xs={12} sm={12} md={12}>
              <RegularCard
                cardTitle="Block"
                plainContent
                content={<Table tableData={tableData} />}
              />
            </ItemGrid>
          )}
        </Grid>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject('account')(observer(Show)));
