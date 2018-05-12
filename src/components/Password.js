import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import styles from '../styles/form';

class Password extends Component {
  submit = () => {
    const pass = document.getElementById('password');
    this.props.submit(pass.value.trim());
  }

  render() {
    const { classes, error } = this.props;

    return (
      <Dialog open fullScreen aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Input password to sign in</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This password is used to protect your wallet
              and is at least 12 characters long.<br />
            It must contain uppercase, lowercase, numbers,
              and special characters. <br />
            The password needs to be properly preserved and
              there is no way to retrieve it once it is lost.<br />
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
        </DialogContent>
        <DialogActions>
          {error && (
            <Button onClick={this.clearTempData} color="primary">
              Restore/Generate
            </Button>
          )}
          <Button onClick={this.submit} color="primary" autoFocus>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default withStyles(styles)(inject('wallet')(observer(Password)));
