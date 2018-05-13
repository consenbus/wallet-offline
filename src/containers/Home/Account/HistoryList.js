import React, { Component } from 'react';
import List, { ListItem, ListItemText } from 'material-ui/List';
import Avatar from 'material-ui/Avatar';
import { Link } from 'react-router-dom';
import { withStyles } from 'material-ui/styles';
import AddCircleOutlineIcon from 'material-ui-icons/AddCircleOutline';
import RemoveCircleOutlineIcon from 'material-ui-icons/RemoveCircleOutline';
import pink from 'material-ui/colors/pink';
import green from 'material-ui/colors/green';
import _map from 'lodash/map';

import converter from '../../../utils/converter';

const styles = {
  avatar: {},
  pinkAvatar: {
    color: '#fff',
    backgroundColor: pink[500],
    marginRight: '10px',
  },
  greenAvatar: {
    color: '#fff',
    backgroundColor: green[500],
    marginRight: '10px',
  },
  name: {
    color: '#f6f6f6',
    fontSize: '20px',
  },
};

class HistoryList extends Component {
  render() {
    const { list, classes } = this.props;
    return (
      <List>
        {_map(list, h => (
          <ListItem key={h.hash} component={Link} to={`/explorer/blocks/${h.hash}`}>
            {h.type === 'receive' ? (
              <Avatar className={classes.greenAvatar}>
                <AddCircleOutlineIcon />
              </Avatar>
            ) : (
              <Avatar className={classes.pinkAvatar}>
                <RemoveCircleOutlineIcon />
              </Avatar>
            )}
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
              <ListItemText
                primary={h.account}
                secondary={
                  `${converter.unit(h.amount || 0, 'raw', 'BUS')} BUS`
                }
              />
            </span>
          </ListItem>
        ))}
      </List>
    );
  }
}

export default withStyles(styles)(HistoryList);
