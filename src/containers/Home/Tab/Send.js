import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { Redirect } from "react-router-dom";
import _isEmpty from "lodash/isEmpty";
import { withStyles } from "material-ui/styles";
import TextField from "material-ui/TextField";
// import MenuItem from "material-ui/Menu/MenuItem";
import Card, { CardActions, CardContent } from "material-ui/Card";
import { CircularProgress } from "material-ui/Progress";
import Button from "material-ui/Button";
import Layout from "../_Layout";
import Header from "./_Header";
import styles from "../../../styles/form";
import converter from "../../../utils/converter";

const { unit, minusFee } = converter;

class Send extends Component {
  state = {
    to: "",
    toError: "",
    amount: "0.01",
    amountError: "",
    password: "",
    passwordError: "",
    loading: false,
    success: false
  };

  componentWillMount() {
    const { to } = this.props.match.params;
    if (to && to.startsWith("bus_")) this.setState({ to });
  }

  formatAmount = event => {
    this.setState({
      amount: converter.unit(event.target.value, "BUS", "BUS"),
      amountError: ""
    });
  };

  handleChangeForm = name => event => {
    this.setState({
      [name]: event.target.value,
      [`${name}Error`]: ""
    });
  };

  handleSend = async e => {
    e.preventDefault();

    const { wallet } = this.props;
    const { amount, password, to } = this.state;
    if (to === "") {
      this.setState({ toError: "Recipient address must not be blank." });
      return;
    }

    if (amount === "") {
      this.setState({ amountError: "Amount must not be blank." });
      return;
    }

    if (+amount <= 0.01) {
      this.setState({ amountError: "Amount must great then 0.01." });
      return;
    }

    this.setState({ loading: true });
    try {
      await wallet.send(amount, "BUS", to, password);
    } catch (error) {
      const { field = "password" } = error;
      this.setState({ [`${field}Error`]: error.message, loading: false });
      return;
    }

    this.setState({
      success: true,
      loading: false
    });
  };

  render() {
    const {
      classes,
      wallet: { accounts, currentIndex }
    } = this.props;
    const inputProps = {
      disableUnderline: true,
      classes: {
        root: classes.textFieldRoot,
        input: classes.textFieldInput
      }
    };
    const inputLabelProps = {
      shrink: true,
      className: classes.textFieldFormLabel
    };
    const { loading, success } = this.state;
    const [address] = accounts[currentIndex];

    if (success) {
      return <Redirect to="/" />;
    }

    return (
      <Layout active="send">
        <Header title="Send" />

        <div style={{ padding: 20 }}>
          <Card>
            <CardContent>
              <form
                className={classes.container}
                noValidate
                autoComplete="off"
                onSubmit={this.handleSend}
              >
                <TextField
                  id="select-account"
                  label="Sender"
                  fullWidth
                  value={address}
                  margin="normal"
                  InputProps={{
                    disableUnderline: true,
                    className: classes.textFieldUnit
                  }}
                />

                <TextField
                  id="full-width"
                  label="Recipient"
                  InputProps={inputProps}
                  InputLabelProps={inputLabelProps}
                  placeholder="Recipient address"
                  margin="normal"
                  fullWidth
                  helperText={this.state.toError}
                  error={!_isEmpty(this.state.toError)}
                  value={this.state.to}
                  onChange={this.handleChangeForm("to")}
                />

                <TextField
                  id="number"
                  label="Amount"
                  type="number"
                  className={classes.textField}
                  InputProps={inputProps}
                  InputLabelProps={inputLabelProps}
                  margin="normal"
                  helperText={this.state.amountError}
                  error={!_isEmpty(this.state.amountError)}
                  value={this.state.amount}
                  onBlur={this.formatAmount}
                  onChange={this.handleChangeForm("amount")}
                />

                <TextField
                  id="select-unit"
                  label="Unit"
                  value="BUS"
                  helperText=""
                  margin="normal"
                  InputProps={{
                    disableUnderline: true,
                    className: classes.textFieldUnit
                  }}
                  InputLabelProps={inputLabelProps}
                />

                <TextField
                  id="trade-fee"
                  label="Received(fee 0.01 BUS)"
                  value={minusFee(unit(this.state.amount || 0, "BUS", "raw"))}
                  helperText=""
                  margin="normal"
                  style={{ width: "250px" }}
                  InputProps={{
                    disableUnderline: true,
                    className: classes.textFieldUnit
                  }}
                />

                <TextField
                  id="wallet-password"
                  label="Password"
                  InputProps={inputProps}
                  InputLabelProps={inputLabelProps}
                  placeholder="Wallet password"
                  margin="normal"
                  type="password"
                  fullWidth
                  helperText={this.state.passwordError}
                  error={!_isEmpty(this.state.passwordError)}
                  value={this.state.password}
                  onChange={this.handleChangeForm("password")}
                />
              </form>
            </CardContent>
            <CardActions>
              <div className={classes.wrapper}>
                <Button
                  variant="raised"
                  color="secondary"
                  fullWidth
                  style={{
                    margin: "0 12px 20px 12px",
                    color: "white"
                  }}
                  disabled={loading}
                  onClick={this.handleSend}
                >
                  Send
                </Button>
                {loading && (
                  <CircularProgress
                    size={24}
                    className={classes.buttonProgress}
                  />
                )}
              </div>
            </CardActions>
          </Card>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject("wallet")(observer(Send)));
