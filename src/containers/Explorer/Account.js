import React from "react";
import { withStyles } from "material-ui/styles";
import Divider from "material-ui/Divider";
import Card, { CardHeader } from "material-ui/Card";
import { LinearProgress } from "material-ui/Progress";

import converter from "../../utils/converter";
import HistoryList from "../Home/Account/HistoryList";
import Layout from "../Home/_Layout";
import Header from "../Home/Tab/_Header";
import rpc from "../../utils/rpc";

const styles = {
  error: {
    border: "1px solid #ffa39e",
    backgroundColor: "#fff1f0",
    padding: "5px",
    margin: "10px"
  }
};

class Account extends React.Component {
  state = {
    account: null, // current select block detail from rpc
    history: [], // newest history block maxium 1000 items
    infoLoading: false, // get account info from rpc process
    historyLoading: false, // get account history from rpc process
    infoError: null, // error message at get account info from rpc process
    historyError: null // error message at get account history from rpc process
  };

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
      historyLoading: true
    });
    try {
      const { data: history } = await rpc.post("/", {
        action: "account_history",
        account,
        count: 1000
      });

      this.setState({
        history: history.history,
        historyError: null,
        historyLoading: false
      });
    } catch (error) {
      this.setState({
        historyError: error,
        historyLoading: false
      });
    }
  }

  async getAccountInfo(account) {
    this.setState({
      account: null,
      infoLoading: true,
      infoError: null
    });
    try {
      const { data: info } = await rpc.post("/", {
        action: "account_info",
        account
      });

      if (info.error) {
        if (info.error === "Account not found") {
          this.setState({
            account: {
              account,
              balance: "0",
              block_count: 0
            },
            infoError: null,
            infoLoading: false
          });
        } else {
          this.setState({
            infoError: new Error(info.error),
            infoLoading: false
          });
        }
        return;
      }

      this.setState({
        account: Object.assign({ account }, info),
        infoError: null,
        infoLoading: false
      });
      this.getHistsory(account);
    } catch (error) {
      this.setState({
        infoError: error,
        infoLoading: false
      });
    }
  }

  render() {
    const { classes } = this.props;
    const {
      infoLoading,
      infoError,
      historyLoading,
      historyError,
      account,
      history
    } = this.state;

    return (
      <Layout active="">
        <Header title="Chain explorer" />
        <div style={{ padding: 20 }}>
          <Card>
            {infoError && (
              <div className={classes.error}>{infoError.message}</div>
            )}
            {infoLoading && <LinearProgress />}
            {account && (
              <CardHeader
                subheader={account.account}
                title={`Balance: ${converter.unit(
                  account.balance || 0,
                  "raw",
                  "BUS"
                )} BUS`}
              />
            )}
            <Divider />
            <HistoryList
              list={history}
              loading={historyLoading}
              error={historyError}
            />
          </Card>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(Account);
