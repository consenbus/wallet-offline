import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import QRCode from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Snackbar from 'material-ui/Snackbar';
import teal from 'material-ui/colors/teal';

import Layout from '../_Layout';
import Header from './_Header';

class Receive extends Component {
  state = {
    visible: false,
  };

  handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    this.setState({ visible: false });
  };

  render() {
    const { wallet: { accounts, currentIndex } } = this.props;
    const [address] = accounts[currentIndex];

    return (
      <Layout active="receive">
        <Header title="Receive" />

        <div
          style={{
            textAlign: 'center',
            verticalAlign: 'middle',
            marginTop: '50px',
          }}
        >
          <QRCode value={address} size={256} />

          {/* account address */}
          <div style={{ marginTop: '10px' }}>
            <CopyToClipboard
              text={address}
              onCopy={() => {
                window.setTimeout(
                  () => this.setState({ visible: false }),
                  2000,
                );
              }}
            >
              <span className="ellipsis" style={{ color: teal.A700 }}>
                {address}
              </span>
            </CopyToClipboard>
          </div>

          {this.state.visible && (
            <Snackbar
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              open={this.state.visible}
              onClose={this.handleSnackbarClose}
              SnackbarContentProps={{
                'aria-describedby': 'message-id',
              }}
              message={<span id="message-id">Copied.</span>}
            />
          )}
        </div>
      </Layout>
    );
  }
}

export default inject('wallet')(observer(Receive));
