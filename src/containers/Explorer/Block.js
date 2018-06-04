import React from "react";
import _isEmpty from "lodash/isEmpty";
import Grid from "material-ui/Grid";
import { Link } from "react-router-dom";
import { withStyles } from "material-ui/styles";
import { LinearProgress } from "material-ui/Progress";
import ConsenbusWalletCore from "consenbus-wallet-core";

import RegularCard from "../../components/Cards/RegularCard";
import ItemGrid from "../../components/Grid/ItemGrid";
import Table from "../../components/Table/Table";
import converter from "../../utils/converter";

import Layout from "../Home/_Layout";
import Header from "../Home/Tab/_Header";
import rpc from "../../utils/rpc";

const {
  fns: { hex2dec }
} = ConsenbusWalletCore;

const styles = {
  error: {
    border: "1px solid #ffa39e",
    backgroundColor: "#fff1f0",
    padding: "5px",
    margin: "10px"
  }
};

const genesis =
  "BCB7AD11BD179262EFBCD42F449F6B14F8B0939F65CED4AA301EF3225B8C6D06";

const getTableData = block => {
  if (_isEmpty(block)) {
    return [];
  }

  const {
    hash,
    type,
    account,
    balance,
    destination,
    amount,
    source,
    previous,
    work,
    signature
  } = block;

  const data = [["Hash", <code>{hash}</code>], ["Type", <code>{type}</code>]];

  if (account)
    data.push([
      "Account",
      <Link to={`/explorer/accounts/${account}`}>{account}</Link>
    ]);
  if (balance)
    data.push([
      "Balance",
      `${converter.unit(hex2dec(balance || 0), "raw", "BUS")} BUS`
    ]);
  if (destination)
    data.push([
      "Destination",
      <Link to={`/explorer/accounts/${destination}`}>{destination}</Link>
    ]);
  if (amount) {
    if (type === "send") {
      data.push(["Sent", `${converter.plusFee(amount)} BUS`]);
    } else {
      data.push(["Received", `${converter.unit(amount, "raw", "BUS")} BUS`]);
    }
  }

  if (type === "receive" || type === "open") {
    if (source !== genesis) {
      data.push(["Sent", `${converter.plusFee(amount)} BUS`]);
      data.push(["Fee", "0.01 BUS"]);
    }
  }
  if (type === "send") {
    data.push(["Received", `${converter.unit(amount, "raw", "BUS")} BUS`]);
    data.push(["Fee", "0.01 BUS"]);
  }
  if (source !== genesis) {
    data.push([
      "Source",
      <Link to={`/explorer/blocks/${source}`}>{source}</Link>
    ]);
  } else {
    data.push(["Source", source]);
  }
  if (previous)
    data.push([
      "Previous",
      <Link to={`/explorer/blocks/${previous}`}>{previous}</Link>
    ]);
  data.push(["Work", <code>{work}</code>]);
  data.push(["Signature", <code>{signature}</code>]);

  return data;
};

class Show extends React.Component {
  state = {
    block: null, // current select block detail from rpc
    loading: false, // get block detail from rpc process
    error: null // error message at get block detail from rpc process
  };

  componentWillMount() {
    const currentHash = this.props.match.params.hash;
    this.getBlockData(currentHash);
  }

  componentWillReceiveProps(nextProps) {
    const lastHash = this.props.match.params.hash;
    const currentHash = nextProps.match.params.hash;
    if (currentHash !== lastHash) this.getBlockData(currentHash);
  }

  async getBlockData(hash) {
    this.setState({
      block: null,
      loading: true,
      error: null
    });
    try {
      const { data } = await rpc.post("/", {
        action: "blocks_info",
        hashes: [hash]
      });
      const info = data.blocks[hash];
      this.setState({
        block: Object.assign(
          {
            hash,
            account: info.block_account,
            amount: info.amount
          },
          JSON.parse(info.contents)
        ),
        error: null,
        loading: false
      });
    } catch (error) {
      this.setState({
        loading: false,
        error
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
          {!loading &&
            !error &&
            block && (
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

export default withStyles(styles)(Show);
