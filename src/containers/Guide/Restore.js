import React, { Component } from "react";
import { Link, Redirect } from "react-router-dom";
import { observer, inject } from "mobx-react";
import _isEmpty from "lodash/isEmpty";
import _isString from "lodash/isString";
import _every from "lodash/every";
import { withStyles } from "material-ui/styles";
import IconButton from "material-ui/IconButton";
import TextField from "material-ui/TextField";
import Button from "material-ui/Button";
import teal from "material-ui/colors/teal";
import LeftIcon from "material-ui-icons/KeyboardArrowLeft";
import { MenuItem } from "material-ui/Menu";
import Select from "material-ui/Select";

import Layout from "./_Layout";

const styles = theme => ({
  container: {
    display: "flex",
    flexWrap: "wrap"
  },
  textField: {
    // marginLeft: theme.spacing.unit,
    // marginRight: theme.spacing.unit,
    // width: 200
  },
  menu: {
    width: 200
  },
  textFieldRoot: {
    padding: 0,
    "label + &": {
      marginTop: theme.spacing.unit * 3
    }
  },
  textFieldInput: {
    backgroundColor: theme.palette.common.white,
    border: "1px solid #ced4da",
    padding: "10px 5px",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    "&:focus": {
      borderColor: "#80bdff",
      boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)"
    }
  },
  textFieldFormLabel: {
    color: theme.palette.common.white,
    fontSize: 18
  }
});

const langs = {
  zh: "简体中文",
  cht: "繁体中文",
  en: "English",
  jp: "日本語",
  kor: "한국어",
  fra: "Français",
  spa: "El español",
  it: "In Italiano"
};
const hex = new Set("0123456789abcdefABCDEF".split(""));

class Restore extends Component {
  static isSeed(value) {
    if (!_isString(value)) throw Error("Mnemonic/Seed must be a string.");
    return value.length === 64 && _every(value.split(""), x => hex.has(x));
  }

  state = {
    language: "en",
    success: false,
    value: "",
    valueError: "",
    password: "",
    passwordError: "",
    confirmPassword: "",
    confirmPasswordError: ""
  };

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
      [`${name}Error`]: ""
    });
  };

  handleRestore = e => {
    e.preventDefault();
    const { password, confirmPassword, value, language } = this.state;
    const { wallet } = this.props;

    if (value === "") {
      this.setState({ valueError: "Mnemonic/Seed must not be blank." });
      return;
    }

    if (password !== confirmPassword) {
      this.setState({
        confirmPasswordError: "Confirm password must be same the password."
      });
      return;
    }

    wallet.initialize(password);
    if (Restore.isSeed(value)) {
      wallet.restoreFromEntropy(value);
    } else {
      wallet.restoreFromMnemonic(value, language);
    }

    if (wallet.error) {
      this.setState({ valueError: wallet.error.message });
    } else {
      this.setState({ success: true });
    }
  };

  render() {
    if (this.state.success) {
      return <Redirect to="/" />;
    }

    const { classes, wallet } = this.props;

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

    return (
      <Layout>
        <p style={{ textAlign: "left" }}>
          <IconButton color="inherit" component={Link} to="/guide">
            <LeftIcon />
          </IconButton>
        </p>

        <h2>Restore from backup</h2>
        <form
          className={classes.container}
          noValidate
          autoComplete="off"
          onSubmit={this.handleCreateAccount}
        >
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
            onChange={this.handleChange("password")}
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
            onChange={this.handleChange("confirmPassword")}
          />

          <TextField
            label="Mnemonic/Seed"
            InputProps={inputProps}
            InputLabelProps={inputLabelProps}
            placeholder="Input your backup"
            fullWidth
            margin="normal"
            helperText={this.state.valueError}
            error={!_isEmpty(this.state.valueError)}
            onChange={this.handleChange("value")}
            value={this.state.value}
          />
          {this.state.value &&
            !Restore.isSeed(this.state.value) && (
              <Select
                value={this.state.language}
                onChange={this.handleChange("language")}
                inputProps={{
                  name: "language",
                  id: "language-simple"
                }}
              >
                {wallet.languages().map(x => (
                  <MenuItem key={x} value={x}>
                    {langs[x]}
                  </MenuItem>
                ))}
              </Select>
            )}
        </form>

        <div style={{ marginTop: "1rem" }}>
          <Button
            variant="raised"
            color="secondary"
            size="large"
            fullWidth
            style={{
              color: "white",
              backgroundColor: teal.A700
            }}
            onClick={this.handleRestore}
          >
            Restore the account
          </Button>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject("wallet")(observer(Restore)));
