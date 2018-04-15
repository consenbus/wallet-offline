import React from 'react';
import _isEmpty from 'lodash/isEmpty';
import Grid from 'material-ui/Grid';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import _map from 'lodash/map';

import { withStyles } from 'material-ui/styles';
import pink from 'material-ui/colors/pink';
import green from 'material-ui/colors/green';
import blue from 'material-ui/colors/blue';

import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import List, { ListItem, ListItemText } from 'material-ui/List';
import { LinearProgress } from 'material-ui/Progress';
import Avatar from 'material-ui/Avatar';
import EditIcon from 'material-ui-icons/Edit';
import LeftIcon from 'material-ui-icons/KeyboardArrowLeft';
import AddCircleOutlineIcon from 'material-ui-icons/AddCircleOutline';
import RemoveCircleOutlineIcon from 'material-ui-icons/RemoveCircleOutline';

import Layout from '../_Layout';
import Header from '../Tab/_Header';
import converter from '../../../utils/converter';
import Block from './Block';
import rpc from '../../../utils/rpc';

import RegularCard from '../../../components/Cards/RegularCard';
import ItemGrid from '../../../components/Grid/ItemGrid';
import Table from '../../../components/Table/Table';
import converter from '../../../utils/converter';
import { hex2dec } from '../../../utils/wallet/functions';

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

  console.log(block);

  const data = [
    ['Hash', <code>{block.hash}</code>],
    ['Type', <code>{block.type}</code>],
  ];

  if (block.account) data.push(['Account', block.account]);
  if (block.balance) data.push(['Balance', `${converter.unit(hex2dec(block.balance || 0), 'raw', 'BUS')} BUS`]);
  if (block.destination) data.push(['Destination', block.destination]);
  if (block.amount) data.push(['Amount', `${converter.unit(block.amount || 0, 'raw', 'BUS')} BUS`]);
  if (block.source) data.push(['Source', block.source]);
  if (block.previous) data.push(['Previous', block.previous]);
  data.push(['Work', <code>{block.work}</code>]);
  data.push(['Signature', <code>{block.signature}</code>]);

  return data;
};


class Show extends Component {
  state = {
    currentBlock: null, // current select block's hashID for show detail
    block: null, // current select block detail from rpc
    loading: false, // get block detail from rpc process
    error: null, // error message at get block detail from rpc process
  }

  componentWillMount() {
    const account = this.props.match.params.account;
    this.props.account.changeCurrentAccount(account);
    this.props.account.getAccountBalance(account);
    this.props.account.getAccountHistory(account);
  }

  showBlock(block) {
    return async () => {
      if (this.state.currentBlock === block) {
        // close block detail
        this.setState({
          currentBlock: null,
          error: null,
          loading: false,
        });
        return;
      }
      this.setState({
        currentBlock: block,
        loading: true,
      });
      try {
        const { data } = await rpc.post('/', {
          action: 'blocks_info',
          hashes: [block.hash],
        });
        const info = data.blocks[block.hash];
        debugger
        this.setState({
          block: Object.assign({
            account: info.block_account,
            hash: block.hash,
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
    };
  }

  render() {
    const { classes, account } = this.props;
    const addr = this.props.match.params.account;
    const current = account.currentAccount;
    const history = account.currentHistory;

    const {
      currentBlock, block, loading, error,
    } = this.state;
    const action = () => (
      <IconButton
        color="inherit"
        component={Link}
        to={`/accounts/${addr}/edit`}
      >
        <EditIcon />
      </IconButton>
    );

    return (
      <Layout active="">
        <Header
          title={current.name || 'null'}
          link="/"
          icon={LeftIcon}
          action={action}
        />
        <Grid container>
        <ItemGrid xs={12} sm={12} md={12}>
          <RegularCard
            cardTitle="Block"
            plainContent
            content={<Table tableData={tableData} />}
          />
        </ItemGrid>
        </Grid>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject('account')(observer(Show)));
