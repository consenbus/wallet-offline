import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { withStyles } from "material-ui/styles";
import Typography from "material-ui/Typography";
import blue from "material-ui/colors/blue";
import { LinearProgress } from "material-ui/Progress";

import Layout from "../_Layout";
import Header from "./_Header";
import HistoryList from "../Account/HistoryList";
import converter from "../../../utils/converter";

const styles = {
  name: {
    color: "#f6f6f6",
    fontSize: "20px"
  }
};

class Index extends Component {
  state = {};

  render() {
    const { classes, wallet } = this.props;

    const {
      name,
      accounts,
      currentIndex,
      accountLoading,
      currentInfo,
      historyLoading,
      currentHistory
    } = wallet;

    const [address] = accounts[currentIndex];

    return (
      <Layout active="home">
        <Header title="Balance" />
        {accountLoading && <LinearProgress />}
        <div
          style={{
            backgroundColor: blue.A700,
            color: "white",
            textAlign: "center",
            paddingTop: "50px",
            paddingBottom: "50px"
          }}
        >
          <Typography variant="display1" color="inherit">
            <span className={classes.name}>{name}</span>
            <span className="ellipsis">
              {converter.unit(currentInfo.balance || 0, "raw", "BUS")} BUS
            </span>
          </Typography>
          {false && (
            <Typography variant="subheading" color="inherit">
              <span className="ellipsis">
                ≈ $ {converter.dollar(currentInfo.balance)}
              </span>
            </Typography>
          )}
          <Typography variant="subheading" color="inherit">
            <span className="ellipsis">
              <span>Address_{currentIndex + 1}: </span>
              {address}
            </span>
          </Typography>
        </div>
        <HistoryList list={currentHistory} loading={historyLoading} />
      </Layout>
    );
  }
}

export default withStyles(styles)(inject("wallet")(observer(Index)));
