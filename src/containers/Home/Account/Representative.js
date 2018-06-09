import React, { Component } from "react";
import { observer, inject } from "mobx-react";
import { Link, Redirect } from "react-router-dom";
import { withStyles } from "material-ui/styles";
import TextField from "material-ui/TextField";
import Card, { CardActions, CardContent } from "material-ui/Card";
import LeftIcon from "material-ui-icons/KeyboardArrowLeft";
import Button from "material-ui/Button";
import _isEmpty from "lodash/isEmpty";
import Layout from "../_Layout";
import Header from "../Tab/_Header";
import styles from "../../../styles/form";

class Representative extends Component {
  state = {
    success: false,
    password: "",
    passwordError: "",
    representative: "",
    representativeError: ""
  };

  componentWillMount() {
    const { wallet } = this.props;
    wallet.getRepresentative().then(rep => {
      this.setState({ representative: rep || "null" });
    });
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
      [`${name}Error`]: ""
    });
  };

  handleEditRepresentative = async e => {
    e.preventDefault();

    const { wallet } = this.props;
    const { representative, password } = this.state;
    if (representative === "") {
      this.setState({
        representativeError: "Representative account must not be blank."
      });
      return;
    }

    if (password === "") {
      this.setState({
        passwordError: "Password must not be blank."
      });
      return;
    }

    try {
      await wallet.changeRepresentative(this.state.representative, password);
    } catch (error) {
      this.setState({ passwordError: error.message });
      return;
    }
    this.setState({ success: true });
  };

  render() {
    const accountParam = this.props.match.params.account;
    if (this.state.success) {
      return <Redirect to="/" />;
    }

    const { classes } = this.props;
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
      <Layout active="">
        <Header
          title="Edit representative"
          link="/tab/setting"
          icon={LeftIcon}
        />

        <div style={{ padding: 20 }}>
          <Card>
            <CardContent>
              <form className={classes.container} noValidate autoComplete="off">
                <TextField
                  id="full-width"
                  label="Representative account"
                  InputProps={inputProps}
                  InputLabelProps={inputLabelProps}
                  placeholder=""
                  helperText={this.state.representativeError}
                  fullWidth
                  value={this.state.representative}
                  error={!_isEmpty(this.state.representativeError)}
                  margin="normal"
                  onChange={this.handleChange("representative")}
                />
                <TextField
                  id="wallet-password"
                  label="Wallet password"
                  InputProps={inputProps}
                  InputLabelProps={inputLabelProps}
                  placeholder="Wallet password"
                  margin="normal"
                  type="password"
                  fullWidth
                  helperText={this.state.passwordError}
                  error={!_isEmpty(this.state.passwordError)}
                  value={this.state.password}
                  onChange={this.handleChange("password")}
                />
              </form>
            </CardContent>
            <CardActions>
              <Button
                variant="raised"
                color="secondary"
                fullWidth
                style={{
                  margin: "0 12px 20px 12px",
                  color: "white"
                }}
                onClick={this.handleEditRepresentative}
              >
                Update
              </Button>
            </CardActions>
          </Card>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject("wallet")(observer(Representative)));
