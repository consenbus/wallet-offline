import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import IconButton from 'material-ui/IconButton';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import teal from 'material-ui/colors/teal';
import LeftIcon from 'material-ui-icons/KeyboardArrowLeft';
import Tabs, { Tab } from 'material-ui/Tabs';
import Paper from 'material-ui/Paper';
import Typography from 'material-ui/Typography';
import Chip from 'material-ui/Chip';

import Layout from './_Layout';
import Password from '../../components/Password';
import styles from '../../styles/form';

class WriteDown extends Component {
  state = {
    type: 'mnemonic', // entropy or mnemonic
    language: 'en',
    content: null,
    password: null,
  }
getBackupContent(password, type, language) {
    const { wallet } = this.props;
    let content;
    if (type === 'mnemonic') {
      content = wallet.backupFromMnemonic(password, language);
    } else {
      content = wallet.backupFromEntropy(password);
    }
    this.setState({ content });
  }

  changeType = (event, type) => {
    this.setState({ type });
    this.getBackupContent(this.state.password, type, this.state.language);
  }

  changeLanguage = (event, language) => {
    this.setState({ language });
    this.getBackupContent(this.state.password, this.state.type, language);
  }

  clearTempData = () => {
    const { wallet } = this.props;
    wallet.clearTempData();
  }

  receivePassword = (password) => {
    this.setState({ password });
    const { wallet } = this.props;
    if (!wallet.core || !wallet.core.exists()) {
      wallet.initialize(password);
    }
    this.getBackupContent(password, this.state.type, this.state.language);
  }

  render() {
    const {
      password, type, language, content,
    } = this.state;
    const { wallet, classes } = this.props;

    if (!password || wallet.error) {
      return (
        <Password
          submit={this.receivePassword}
          clearTempData={this.clearTempData}
          error={wallet.error}
        />
      );
    }

    return (
      <Layout>
        <p style={{ textAlign: 'left' }}>
          <IconButton
            color="inherit"
            component={Link}
            to="/guide/no-screenshot"
          >
            <LeftIcon />
          </IconButton>
        </p>

        <Paper className={classes.root}>
          <Tabs
            value={type}
            onChange={this.changeType}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Mnemonic" value="mnemonic" />
            <Tab label="Seed" value="entropy" />
          </Tabs>
          {type === 'entropy' && (
            <Typography >
              <p style={{ marginTop: '1rem' }}>
                Please carefully write down this 64 character seed.
              </p>
              <div style={{
                fontSize: '1.5rem',
                marginBottom: '1rem',
                color: teal.A700,
                padding: '1rem',
                textAlign: 'left',
              }}
              >
                <p className="ellipsis">
                  {content}
                </p>
              </div>
            </Typography>
          )}
          {type === 'mnemonic' && (
            <Typography>
              <p style={{ marginTop: '1rem' }}>
                Please carefully write down this 24 words.
              </p>
              <div style={{
                fontSize: '1.5rem', padding: '1rem', lineHeight: '2rem', textAlign: 'left',
              }}
              >
                {content.split(' ').map(x => (
                  <Chip
                    key={x}
                    label={x}
                    className={classes.chip}
                    style={{ marginRight: '0.3rem' }}
                  />
                ))}
              </div>
            </Typography>
          )}
        </Paper>

        <div style={{ marginTop: '1rem' }}>
          <Button
            variant="raised"
            color="secondary"
            size="large"
            fullWidth
            component={Link}
            to="/guide/done"
            style={{
              color: 'white',
              backgroundColor: teal.A700,
            }}
          >
            I have written it down
          </Button>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(inject('wallet')(observer(WriteDown)));
