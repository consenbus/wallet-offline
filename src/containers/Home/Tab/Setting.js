import React, { Component } from "react";
import { Link } from "react-router-dom";
import { withStyles } from "material-ui/styles";
import List, { ListItem, ListItemText } from "material-ui/List";
import Divider from "material-ui/Divider";
import Card from "material-ui/Card";
import RightIcon from "material-ui-icons/KeyboardArrowRight";
import Layout from "../_Layout";
import Header from "./_Header";

const styles = theme => ({
  root: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  }
});
class Setting extends Component {
  state = {};

  handleItemClick = (e, { name }) => this.setState({ activeItem: name });

  render() {
    // const { classes } = this.props;
    return (
      <Layout active="setting">
        <Header title="Settings" />
        <div style={{ padding: 20 }}>
          <Card>
            <List component="nav">
              <ListItem button>
                <ListItemText primary="Language" />
                <RightIcon />
              </ListItem>
              <ListItem button component={Link} to="/guide">
                <ListItemText primary="Help & Support" />
                <RightIcon />
              </ListItem>
            </List>
            <Divider />
            <List component="nav">
              <ListItem button onClick={this.openChangePasswordDialog}>
                <ListItemText primary="Security Preferences" secondary="Change password" />
                <RightIcon />
              </ListItem>
            </List>
          </Card>
        </div>
      </Layout>
    );
  }
}

export default withStyles(styles)(Setting);
