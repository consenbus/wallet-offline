import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { observer, inject } from 'mobx-react';

import { withStyles } from 'material-ui/styles';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import Button from 'material-ui/Button';
import teal from 'material-ui/colors/teal';
import red from 'material-ui/colors/red';
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

class Tooltips extends Component {
  state = {
    success: false,
    disabled: true,
    option: null,
    error: null,
  };

  submit = () => {
    const { disabled, option } = this.state;

    const error = option === 'A' ? null : Error('Please confirm the description of the mnemonic.');
    const success = !disabled && !error;
    this.setState({ success, error });
  };

  select(option) {
    return () => {
      const disabled = false;

      this.setState({ disabled, option });
    };
  }

  render() {
    const { success, error, disabled } = this.state;
    if (success) {
      return <Redirect to="/guide/create" />;
    }

    const { classes } = this.props;

    return (
      <Layout>
        <p style={{ textAlign: 'left' }}>
          <IconButton color="inherit" component={Link} to="/guide">
            <LeftIcon />
          </IconButton>
        </p>

        <h2>What are mnemonics</h2>
        <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
          The mnemonic is the account and pin of your digital wallet,
          and you are the only person who has access to it.
          The Qbao Network platform will never record your mnemonic.
          Once it’s lost, there’s no way to recover your asset.
          Therefore, please backup your mnemonic and keep the 12 phases in a safe please.
        </div>
        <Card className={classes.card}>
          <CardContent>
            <Typography className={classes.title} color="textSecondary">
              Take a closer look at the words above. answer the following questions!
            </Typography>
            <Typography variant="headline" component="h2" style={{ textAlign: 'left', fontSize: '1.2rem' }}>
              What do I do if I lost or misremembered my mnemonic?
            </Typography>
            <Typography component="div" style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="option-A">
                  <input type="radio" id="option-A" name="option" value="A" onClick={this.select('A')} />
                  Recollect yourself carefully, looking for places that might be recorded.
                </label>
              </div>
              <div>
                <label htmlFor="option-B">
                  <input type="radio" id="option-B" name="option" value="B" onClick={this.select('B')} />
                  Contact Consenbus and they can help find them back.
                </label>
              </div>
            </Typography>
            {error && (
              <Typography
                style={{
                  textAlign: 'left',
                  borderRadius: 2,
                  backgroundColor: red[100],
                  padding: '5px',
                }}
              >
                {error.message}
              </Typography>
            )}
          </CardContent>
          <CardActions>
            <Button
              variant="raised"
              color="secondary"
              size="large"
              disabled={disabled}
              fullWidth
              style={{
                color: 'white',
                backgroundColor: disabled ? teal.A900 : teal.A700,
              }}
              onClick={this.submit}
            >
            Submit and move to generate
            </Button>
          </CardActions>
        </Card>

        <div style={{ marginTop: '1rem' }} />
      </Layout>
    );
  }
}

export default withStyles(styles)(inject('wallet')(observer(Tooltips)));
