import React, { Component } from "react";
import List, { ListItem, ListItemText } from "material-ui/List";
import Avatar from "material-ui/Avatar";
import { Link } from "react-router-dom";
import { withStyles } from "material-ui/styles";
import AddCircleOutlineIcon from "material-ui-icons/AddCircleOutline";
import RemoveCircleOutlineIcon from "material-ui-icons/RemoveCircleOutline";
import pink from "material-ui/colors/pink";
import green from "material-ui/colors/green";
import { LinearProgress } from "material-ui/Progress";
import _map from "lodash/map";

import converter from "../../../utils/converter";

const styles = {
  avatar: {},
  pinkAvatar: {
    color: "#fff",
    backgroundColor: pink[500],
    marginRight: "10px"
  },
  greenAvatar: {
    color: "#fff",
    backgroundColor: green[500],
    marginRight: "10px"
  },
  name: {
    color: "#f6f6f6",
    fontSize: "20px"
  },
  error: {
    border: "1px solid #ffa39e",
    backgroundColor: "#fff1f0",
    padding: "5px",
    margin: "10px"
  }
};

class HistoryList extends Component {
  render() {
    const { list, classes, loading, error } = this.props;

    if (!loading && !list.length) {
      return (
        <div className={classes.error}>
          The account is not activated, and will be activated when a successful
          transfer is received.
        </div>
      );
    }
    return (
      <div>
        {error && <div className={classes.error}>{error.message}</div>}
        {loading && <LinearProgress />}
        <List>
          {_map(list, h => (
            <ListItem
              key={h.hash}
              component={Link}
              to={`/explorer/blocks/${h.hash}`}
            >
              {h.type === "receive" ? (
                <Avatar className={classes.greenAvatar}>
                  <AddCircleOutlineIcon />
                </Avatar>
              ) : (
                <Avatar className={classes.pinkAvatar}>
                  <RemoveCircleOutlineIcon />
                </Avatar>
              )}
              <span style={{ textOverflow: "ellipsis", overflow: "hidden" }}>
                <ListItemText
                  primary={h.account}
                  secondary={
                    h.type !== "receive"
                      ? `${converter.plusFee(h.amount)} BUS`
                      : `${converter.unit(h.amount || 0, "raw", "BUS")} BUS`
                  }
                />
              </span>
            </ListItem>
          ))}
        </List>
      </div>
    );
  }
}

export default withStyles(styles)(HistoryList);
