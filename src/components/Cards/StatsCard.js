import React from "react";
import {
  withStyles,
  Card,
  //CardContent,
  CardHeader,
  CardActions,
  Typography
} from "material-ui";
import PropTypes from "prop-types";

import statsCardStyle from "../../variables/styles/statsCardStyle";

function StatsCard({ ...props }) {
  const {
    classes,
    title,
    description,
    statLink,
    small,
    statText,
    statIconColor,
    iconColor
  } = props;
  return (
    <Card className={classes.card}>
      <CardHeader
        classes={{
          root: classes.cardHeader + " " + classes[iconColor + "CardHeader"],
          avatar: classes.cardAvatar
        }}
        avatar={<props.icon className={classes.cardIcon} />}
      />
      <div className={classes.cardContent}>
        <Typography component="p" className={classes.cardCategory}>
          {title}
        </Typography>
        <Typography
          variant="headline"
          component="h2"
          className={classes.cardTitle}
        >
          {description}{" "}
          {small !== undefined ? (
            <small className={classes.cardTitleSmall}>{small}</small>
          ) : null}
        </Typography>
      </div>
      {statLink && (
        <CardActions className={classes.cardActions}>
          <div className={classes.cardStats}>
            <props.statIcon
              className={
                classes.cardStatsIcon +
                " " +
                classes[statIconColor + "CardStatsIcon"]
              }
            />{" "}
            {statLink !== undefined ? (
              <a href={statLink.href} className={classes.cardStatsLink}>
                {statLink.text}
              </a>
            ) : statText !== undefined ? (
              statText
            ) : null}
          </div>
        </CardActions>
      )}
    </Card>
  );
}

StatsCard.defaultProps = {
  iconColor: "purple",
  statIconColor: "gray"
};

StatsCard.propTypes = {
  classes: PropTypes.object.isRequired,
  icon: PropTypes.func.isRequired,
  iconColor: PropTypes.oneOf(["orange", "green", "red", "blue", "purple"]),
  title: PropTypes.node,
  description: PropTypes.node,
  small: PropTypes.node,
  statIcon: PropTypes.func,
  statIconColor: PropTypes.oneOf([
    "warning",
    "primary",
    "danger",
    "success",
    "info",
    "rose",
    "gray"
  ]),
  statLink: PropTypes.object,
  statText: PropTypes.node
};

export default withStyles(statsCardStyle)(StatsCard);