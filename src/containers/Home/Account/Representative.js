import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Link, Redirect } from 'react-router-dom';
import { withStyles } from 'material-ui/styles';
import TextField from 'material-ui/TextField';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import LeftIcon from 'material-ui-icons/KeyboardArrowLeft';
import Button from 'material-ui/Button';
import _isEmpty from 'lodash/isEmpty';
import Layout from '../_Layout';
import Header from '../Tab/_Header';
import styles from '../../../styles/form';

class Representative extends Component {
  state = {
    success: false,
    representative: '',
    representativeError: '',
  };

  componentWillMount() {
    const account = this.props.match.params.account;
    this.props.account.changeCurrentAccount(account);
    this.props.account.getRepresentative().then((rep) => {
      this.setState({ representative: rep || 'null' });
    });
  }

  handleChange = name => (event) => {
    this.setState({
      [name]: event.target.value,
      [`${name}Error`]: '',
    });
  };

  handleEditRepresentative = (e) => {
    e.preventDefault();
    if (this.state.representative === '') {
      this.setState({
        representativeError: 'Representative account must not be blank.',
      });
      return;
    }

    this.props.account.change(this.state.representative);
    this.setState({ success: true });
  };

  render() {
    const accountParam = this.props.match.params.account;
    if (this.state.success) {
      return <Redirect to={`/accounts/${accountParam}`} />;
    }

    const { classes } = this.props;
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
      <Layout active="">
        <Header
          title="Edit representative"
          link={`/accounts/${accountParam}/edit`}
          icon={LeftIcon}
        />

        <div style={{ padding: 20 }}>
          <Card>
            <CardContent>
              <form
                className={classes.container}
                noValidate
                autoComplete="off"
                method="post"
                onSubmit={this.handleCreateAccount}
              >
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
                  onChange={this.handleChange('representative')}
                />
              </form>
            </CardContent>
            <CardActions>
              <Button
                variant="raised"
                color="secondary"
                fullWidth
                style={{
                  margin: '0 12px 20px 12px',
                  color: 'white',
                }}
                onClick={this.handleEditRepresentative}
              >
                Update
              </Button>
            </CardActions>
          </Card>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Button component={Link} to={`/accounts/${accountParam}/edit`}>
              Back edit account
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject('account')(observer(Representative)));
