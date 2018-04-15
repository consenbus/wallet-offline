import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from 'material-ui/styles';
import BottomNavigation, { BottomNavigationAction } from 'material-ui/BottomNavigation';

// icons
import HomeIcon from 'material-ui-icons/Home';
import ReceiptIcon from 'material-ui-icons/Receipt';
import CameraAltIcon from 'material-ui-icons/CameraAlt';
import SendIcon from 'material-ui-icons/Send';
import SettingsIcon from 'material-ui-icons/Settings';

import AppSearch from '../Explorer/_Search';

const styles = {
  root: {
    width: '100%',
    bottom: '0px',
    left: '0px',
    top: 'auto',
    right: 'auto',
    position: 'fixed',
    zIndex: '101',
    margin: '0em',
  },
  tab: {
    minWidth: '60px',
    paddingLeft: '5px',
    paddingRight: '5px',
  },
  search: {
    position: 'fixed',
    top: '15px',
    right: '5px',
    color: '#fff',
  },
};

class Layout extends Component {
  render() {
    const { classes, active } = this.props;

    return (
      <div>
        <div style={{ marginBottom: '56px' }}>
          {this.props.children}
          <div className={classes.search}>
            <AppSearch />
          </div>
        </div>
        <BottomNavigation value={active} showLabels className={classes.root}>
          <BottomNavigationAction
            label="Home"
            value="home"
            icon={<HomeIcon />}
            component={Link}
            className={classes.tab}
            to="/"
          />
          <BottomNavigationAction
            label="Receive"
            value="receive"
            icon={<ReceiptIcon />}
            component={Link}
            className={classes.tab}
            to="/tab/receive"
          />
          <BottomNavigationAction
            label="Scan"
            value="scan"
            icon={<CameraAltIcon />}
            component={Link}
            className={classes.tab}
            to="/tab/scan"
          />
          <BottomNavigationAction
            label="Send"
            value="send"
            icon={<SendIcon />}
            component={Link}
            className={classes.tab}
            to="/tab/send"
          />
          <BottomNavigationAction
            label="Setting"
            value="setting"
            icon={<SettingsIcon />}
            component={Link}
            className={classes.tab}
            to="/tab/setting"
          />
        </BottomNavigation>
      </div>
    );
  }
}

export default withStyles(styles)(Layout);
