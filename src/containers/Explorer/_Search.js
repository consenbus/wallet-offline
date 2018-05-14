import React from "react";
import SearchIcon from "material-ui-icons/Search";
import { Redirect } from "react-router-dom";
import _startsWith from "lodash/startsWith";
import { withStyles } from "material-ui/styles";
import { fade } from "material-ui/styles/colorManipulator";

const styles = theme => ({
  "@global": {
    ".algolia-autocomplete": {
      fontFamily: theme.typography.fontFamily,
      "& .algolia-docsearch-suggestion--category-header-lvl0": {
        color: theme.palette.text.primary
      },
      "& .algolia-docsearch-suggestion--subcategory-column-text": {
        color: theme.palette.text.secondary
      },
      "& .algolia-docsearch-suggestion--highlight": {
        color: theme.palette.type === "light" ? "#174d8c" : "#acccf1"
      },
      "& .algolia-docsearch-suggestion": {
        background: "transparent"
      },
      "& .algolia-docsearch-suggestion--title": {
        ...theme.typography.title
      },
      "& .algolia-docsearch-suggestion--text": {
        ...theme.typography.body1
      },
      "& .ds-dropdown-menu": {
        boxShadow: theme.shadows[1],
        borderRadius: 2,
        "&::before": {
          display: "none"
        },
        "& [class^=ds-dataset-]": {
          border: 0,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper
        }
      }
    }
  },
  root: {
    fontFamily: theme.typography.fontFamily,
    position: "relative",
    marginRight: theme.spacing.unit * 2,
    marginLeft: theme.spacing.unit,
    borderRadius: 2,
    background: fade(theme.palette.common.white, 0.15),
    "&:hover": {
      background: fade(theme.palette.common.white, 0.25)
    },
    "& $input": {
      transition: theme.transitions.create("width"),
      width: 300,
      "&:focus": {
        width: 450
      }
    }
  },
  search: {
    width: theme.spacing.unit * 9,
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  input: {
    font: "inherit",
    padding: `${theme.spacing.unit}px ${theme.spacing.unit}px ${
      theme.spacing.unit
    }px ${theme.spacing.unit * 9}px`,
    border: 0,
    display: "block",
    verticalAlign: "middle",
    whiteSpace: "normal",
    background: "none",
    margin: 0, // Reset for Safari
    color: "inherit",
    width: "100%",
    "&:focus": {
      outline: 0
    }
  }
});

class AppSearch extends React.Component {
  state = { input: "", redirectType: "" };

  handleSearch = event => {
    event.preventDefault();
    const input = this.state.input;
    if (_startsWith(input, "bus_")) {
      this.setState({ redirectType: "/explorer/accounts/" });
    } else {
      this.setState({ redirectType: "/explorer/blocks/" });
    }
  };

  render() {
    const { classes } = this.props;
    const { redirectType, input } = this.state;
    if (redirectType !== "") {
      return <Redirect to={redirectType + input} />;
    }

    return (
      <form onSubmit={this.handleSearch}>
        <div className={classes.root}>
          <div className={classes.search}>
            <SearchIcon />
          </div>
          <input
            placeholder="Alias, address or block hash"
            onChange={e => this.setState({ input: e.target.value })}
            className={classes.input}
          />
        </div>
      </form>
    );
  }
}

export default withStyles(styles)(AppSearch);
