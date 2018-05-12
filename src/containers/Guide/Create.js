import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import _isEmpty from 'lodash/isEmpty';

import { withStyles } from 'material-ui/styles';
import IconButton from 'material-ui/IconButton';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';
import teal from 'material-ui/colors/teal';
import LeftIcon from 'material-ui-icons/KeyboardArrowLeft';

import Layout from './_Layout';

const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    // marginLeft: theme.spacing.unit,
    // marginRight: theme.spacing.unit,
    // width: 200
  },
  menu: {
    width: 200,
  },
  textFieldRoot: {
    padding: 0,
    'label + &': {
      marginTop: theme.spacing.unit * 3,
    },
  },
  textFieldInput: {
    backgroundColor: theme.palette.common.white,
    border: '1px solid #ced4da',
    padding: '10px 5px',
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&:focus': {
      borderColor: '#80bdff',
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
    },
  },
  textFieldFormLabel: {
    color: theme.palette.common.white,
    fontSize: 18,
  },
});

class Create extends Component {
  state = {
    success: false,
    name: '',
    nameError: '',
    password: '',
    passwordError: '',
    confirmPassword: '',
    confirmPasswordError: '',
  };

  handleChange = name => (event) => {
    this.setState({
      [name]: event.target.value,
      [`${name}Error`]: '',
    });
  }

  handleCreateAccount = (e) => {
    e.preventDefault();
    const { wallet } = this.props;
    const { name, password, confirmPassword } = this.state;
    if (name === '') {
      this.setState({ nameError: 'Name must not be blank.' });
      return;
    }

    if (password !== confirmPassword) {
      this.setState({ confirmPasswordError: 'Confirm password must be same the password.' });
      return;
    }

    wallet.initialize(name, password);
    if (wallet.error) {
      this.setState({ passwordError: wallet.error.message });
    } else {
      wallet.generate();
      this.setState({ success: true });
    }
  }

  render() {
    const { classes } = this.props;
    const { success } = this.state;

    if (success) {
      return <Redirect to="/guide/backup" />;
    }

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

    return (
      <Layout>
        <p style={{ textAlign: 'left' }}>
          <IconButton color="inherit" component={Link} to="/guide/tooltips">
            <LeftIcon />
          </IconButton>
        </p>

        <h2>Create account</h2>
        <form
          className={classes.container}
          noValidate
          autoComplete="off"
          onSubmit={this.handleCreateAccount}
        >
          <TextField
            label="Account name"
            InputProps={inputProps}
            InputLabelProps={inputLabelProps}
            placeholder="Your name"
            helperText={this.state.nameError}
            fullWidth
            value={this.state.name}
            margin="normal"
            error={!_isEmpty(this.state.nameError)}
            onChange={this.handleChange('name')}
          />
          <TextField
            label="Password"
            type="password"
            InputProps={inputProps}
            InputLabelProps={inputLabelProps}
            placeholder="Your password"
            helperText={this.state.passwordError}
            fullWidth
            value={this.state.password}
            margin="normal"
            error={!_isEmpty(this.state.passwordError)}
            onChange={this.handleChange('password')}
          />
          <TextField
            label="Confirm Password"
            type="password"
            InputProps={inputProps}
            InputLabelProps={inputLabelProps}
            placeholder="Confirm password"
            helperText={this.state.confirmPasswordError}
            fullWidth
            value={this.state.confirmPassword}
            margin="normal"
            error={!_isEmpty(this.state.confirmPasswordError)}
            onChange={this.handleChange('confirmPassword')}
          />
        </form>

        <div style={{ marginTop: '1rem' }}>
          <Button
            variant="raised"
            color="secondary"
            size="large"
            fullWidth
            style={{
              color: 'white',
              backgroundColor: teal.A700,
            }}
            onClick={this.handleCreateAccount}
          >
            Create new account
          </Button>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject('wallet')(observer(Create)));
