import React from 'react';
import _map from 'lodash/map';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';

import { withStyles } from 'material-ui/styles';
import pink from 'material-ui/colors/pink';
import green from 'material-ui/colors/green';
import Divider from 'material-ui/Divider';
import Avatar from 'material-ui/Avatar';
import List, { ListItem, ListItemText } from 'material-ui/List';
import Card, { CardHeader } from 'material-ui/Card';
import { LinearProgress } from 'material-ui/Progress';
import AddCircleOutlineIcon from 'material-ui-icons/AddCircleOutline';
import RemoveCircleOutlineIcon from 'material-ui-icons/RemoveCircleOutline';

import converter from '../../utils/converter';

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

class Account extends React.Component {
  state = {
    account: null, // current select block detail from rpc
    history: [], // newest history block maxium 1000 items
    infoLoading: false, // get account info from rpc process
    historyLoading: false, // get account history from rpc process
    infoError: null, // error message at get account info from rpc process
    historyError: null, // error message at get account history from rpc process
  }

  componentWillMount() {
    const { account } = this.props.match.params;
    this.getAccountInfo(account);
  }

  componentWillReceiveProps(nextProps) {
    const account = this.props.match.params.account;
    const currentAccount = nextProps.match.params.account;
    if (currentAccount !== account) this.getAccountInfo(currentAccount);
  }

  async getHistsory(account) {
    this.setState({
      history: [],
      historyError: null,
      historyLoading: true,
    });
    try {
      const { data: history } = await rpc.post('/', {
        action: 'account_history',
        account,
        count: 1000,
      });

      this.setState({
        history: history.history,
        historyError: null,
        historyLoading: false,
      });
    } catch (error) {
      this.setState({
        historyError: error,
        historyLoading: false,
      });
    }
  }

  async getAccountInfo(account) {
    this.setState({
      account: null,
      infoLoading: true,
      infoError: null,
    });
    try {
      const { data: info } = await rpc.post('/', {
        action: 'account_info',
        account,
      });

      if (info.error) {
        this.setState({
          infoError: new Error(info.error),
          infoLoading: false,
        });
        return;
      }

      this.setState({
        account: Object.assign({
          account,
        }, info),
        infoError: null,
        infoLoading: false,
      });
      this.getHistsory(account);
    } catch (error) {
      this.setState({
        infoError: error,
        infoLoading: false,
      });
    }
  }

  render() {
    const { classes } = this.props;
    const {
      infoLoading, infoError, historyLoading, historyError, account, history,
    } = this.state;

    return (
      <Layout active="">
        <Header title="Chain explorer" />
        <div style={{ padding: 20 }}>
          <Card>
            {infoError && <div className={classes.error}>{infoError.message}</div>}
            {infoLoading && <LinearProgress />}
            {!infoLoading && !infoError && <CardHeader
              subheader={account.account}
              title={`Balance: ${converter.unit(account.balance || 0, 'raw', 'BUS')} BUS`}
            />}
            <Divider />
            <List>
              {historyError && <div className={classes.error}>{historyError.message}</div>}
              {historyLoading && <LinearProgress />}
              {!historyLoading && !historyError && _map(history, h => (
                <ListItem component={Link} to={`/explorer/blocks/${h.hash}`}>
                  {h.type === 'receive' ? (
                    <Avatar className={classes.greenAvatar}>
                      <AddCircleOutlineIcon />
                    </Avatar>
                  ) : (
                    <Avatar className={classes.pinkAvatar}>
                      <RemoveCircleOutlineIcon />
                    </Avatar>
                  )}
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    <ListItemText
                      primary={h.account}
                      secondary={
                        `${converter.unit(h.amount || 0, 'raw', 'BUS')} BUS`
                      }
                    />
                  </span>
                </ListItem>
              ))}
            </List>
          </Card>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject('account')(observer(Account)));
