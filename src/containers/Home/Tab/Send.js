import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import _map from 'lodash/map';
import _isEmpty from 'lodash/isEmpty';
import { withStyles } from 'material-ui/styles';
import TextField from 'material-ui/TextField';
// import MenuItem from "material-ui/Menu/MenuItem";
import { MenuItem } from 'material-ui/Menu';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import { CircularProgress } from 'material-ui/Progress';
import Button from 'material-ui/Button';
import Layout from '../_Layout';
import Header from './_Header';
import styles from '../../../styles/form';

const units = [
  { label: 'GBUS', value: 'GBUS' },
  { label: 'MBUS', value: 'MBUS' },
  { label: 'kBUS', value: 'kBUS' },
  { label: 'BUS', value: 'BUS' },
  { label: 'mBUS', value: 'mBUS' },
  { label: 'uBUS', value: 'uBUS' },
  { label: 'nBUS', value: 'nBUS' },
];

class Send extends Component {
  state = {
    account: '',
    accountError: '',
    amount: '',
    amountError: '',
    unit: 'BUS',
    loading: false,
  };

  handleChangeForm = name => (event) => {
    this.setState({
      [name]: event.target.value,
      [`${name}Error`]: '',
    });
  };

  handleChangeSender = (ev) => {
    this.props.account.changeCurrentAccount(ev.target.value);
  };

  handleSend = async (e) => {
    e.preventDefault();
    if (this.state.account === '') {
      this.setState({ accountError: 'Recipient address must not be blank.' });
      return;
    }

    if (this.state.amount === '') {
      this.setState({ amountError: 'Amount must not be blank.' });
      return;
    }

    const {
      amount, unit, account: toAccountAddress,
    } = this.state;

    this.setState({ loading: true });
    await this.props.account
      .send(amount, unit, toAccountAddress);
    this.setState({ loading: false });
  };

  render() {
    const { classes, account: { accounts } } = this.props;
    const account = this.props.account.currentAccount;
    const inputProps = {
      disableUnderline: true,
      classes: {
        root: classes.textFieldRoot,
        input: classes.textFieldInput,
      },
    };
    const inputLabelProps = {
      shrink: true,
      className: classes.textFieldFormLabel,
    };
    const { loading } = this.state;

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
                  select
                  label="Sender"
                  value={account.account}
                  onChange={this.handleChangeSender}
                  helperText="Choice sender"
                  margin="normal"
                  InputProps={{
                    disableUnderline: true,
                    className: classes.textFieldUnit,
                  }}
                  InputLabelProps={inputLabelProps}
                >
                  {_map(accounts, x => (
                    <MenuItem key={x.account} value={x.account}>
                      {x.name || x.account}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  id="full-width"
                  label="Recipient"
                  InputProps={inputProps}
                  InputLabelProps={inputLabelProps}
                  placeholder="Recipient address"
                  margin="normal"
                  fullWidth
                  helperText={this.state.accountError}
                  error={!_isEmpty(this.state.accountError)}
                  value={this.state.account}
                  onChange={this.handleChangeForm('account')}
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
                  onChange={this.handleChangeForm('amount')}
                />

                <TextField
                  id="select-unit"
                  select
                  label="Unit"
                  value={this.state.unit}
                  onChange={this.handleChangeForm('unit')}
                  helperText=""
                  margin="normal"
                  InputProps={{
                    disableUnderline: true,
                    className: classes.textFieldUnit,
                  }}
                  InputLabelProps={inputLabelProps}
                >
                  {units.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </form>
            </CardContent>
            <CardActions>
              <div className={classes.wrapper}>
                <Button
                  variant="raised"
                  color="secondary"
                  fullWidth
                  style={{
                    margin: '0 12px 20px 12px',
                    color: 'white',
                  }}
                  disabled={loading}
                  onClick={this.handleSend}
                >
                  Send
                </Button>
                {loading && <CircularProgress size={24} className={classes.buttonProgress} />}
              </div>
            </CardActions>
          </Card>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject('account')(observer(Send)));
