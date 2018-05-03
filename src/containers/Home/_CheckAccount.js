import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Redirect, Route } from 'react-router-dom';
import { CircularProgress } from 'material-ui/Progress';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import styles from '../../styles/form';

class CheckAccount extends Component {
  componentWillMount() {
    this.props.account.loadAccounts();
  }

  setPassword = () => {
    const { account } = this.props;
    const elem = document.getElementById('password');
    account.setPassword(elem.value.trim());
  }

  render() {
    const {
      classes,
      account,
      component: ComponentSub,
      ...rest
    } = this.props;
    // NOTICE: keep `loading` outside of renderer
    const { passwordExists, passwordError, loading } = account;

    const renderer = (props) => {
      if (!passwordExists) {
        return (
          <Dialog open aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Set password</DialogTitle>
            <DialogContent>
              <DialogContentText>
                This password is used to protect your wallet
                  and is at least 12 characters long.<br />
                It must contain uppercase, lowercase, numbers,
                  and special characters. <br />
                The password needs to be properly preserved and
                  there is no way to retrieve it once it is lost.
                {passwordError && <p className={classes.error}>{passwordError.message}</p>}
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="password"
                label="Password"
                type="password"
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.setPassword} color="primary">
                Submit
              </Button>
            </DialogActions>
          </Dialog>
        );
      }

      if (loading) {
        return (
          <div style={{ textAlign: 'center' }}>
            <CircularProgress />
          </div>
        );
      }

      if (account.hasAccounts()) {
        return <ComponentSub {...props} />;
      }

      return (
        <Redirect
          to={{
            pathname: '/guide',
            state: { from: props.location },
          }}
        />
      );
    };

    return <Route {...rest} render={renderer} />;
  }
}

export default withStyles(styles)(inject('account')(observer(CheckAccount)));
