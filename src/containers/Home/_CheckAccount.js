import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Redirect, Route } from 'react-router-dom';
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
  clearTempData = () => {
    const { wallet } = this.props;
    wallet.clearTempData();
  }

  signin = () => {
    const { wallet } = this.props;
    const pass = document.getElementById('password');
    const salt = document.getElementById('salt');
    wallet.initialize(pass.value.trim(), salt.value.trim());
  }

  render() {
    const {
      classes,
      wallet,
      component: ComponentSub,
      ...rest
    } = this.props;
    const { error } = wallet;

    const renderer = (props) => {
      if (wallet.isExists()) {
        return (
          <Dialog open fullScreen aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Input password and salt to sign in</DialogTitle>
            <DialogContent>
              <DialogContentText>
                This password is used to protect your wallet
                  and is at least 12 characters long.<br />
                It must contain uppercase, lowercase, numbers,
                  and special characters. <br />
                The password needs to be properly preserved and
                  there is no way to retrieve it once it is lost.<br />
                This salt is optional, Keep in line with you before.
              </DialogContentText>
              {error && <div className={classes.error}>{error.message}</div>}
              <TextField
                autoFocus
                margin="dense"
                id="password"
                label="Password"
                type="password"
                fullWidth
              />
              <TextField
                margin="dense"
                id="salt"
                label="Salt"
                type="password"
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              {error && (
                <Button onClick={this.clearTempData} color="primary">
                  Restore/Generate
                </Button>
              )}
              <Button onClick={this.signin} color="primary" autoFocus>
                Submit
              </Button>
            </DialogActions>
          </Dialog>
        );
      }

      if (wallet.core && wallet.core.exists()) {
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

export default withStyles(styles)(inject('wallet')(observer(CheckAccount)));
