import React from 'react';
import {
  withStyles,
  Card,
  CardContent,
  CardHeader,
  CardActions,
} from 'material-ui';
import PropTypes from 'prop-types';
import cx from 'classnames';

import regularCardStyle from '../../variables/styles/regularCardStyle';

function RegularCard({ ...props }) {
  const {
    classes,
    headerColor,
    plainCard,
    cardTitle,
    cardSubtitle,
    content,
    plainContent,
    footer,
  } = props;
  const plainCardClasses = cx({
    [` ${classes.cardPlain}`]: plainCard,
  });
  const cardPlainHeaderClasses = cx({
    [` ${classes.cardPlainHeader}`]: plainCard,
  });
  return (
    <Card className={classes.card + plainCardClasses}>
      <CardHeader
        classes={{
          root: [
            classes.cardHeader,
            classes[`${headerColor}CardHeader`],
            cardPlainHeaderClasses,
          ].join(' '),
          title: classes.cardTitle,
          subheader: classes.cardSubtitle,
        }}
        title={cardTitle}
        subheader={cardSubtitle}
      />

      {plainContent ? (
        <div>{content}</div>
      ) : (
        <CardContent>{content}</CardContent>
      )}

      {footer !== undefined ? (
        <CardActions className={classes.cardActions}>{footer}</CardActions>
      ) : null}
    </Card>
  );
}

RegularCard.defaultProps = {
  headerColor: 'grey',
};

RegularCard.propTypes = {
  plainCard: PropTypes.bool,
  classes: PropTypes.object.isRequired,
  headerColor: PropTypes.oneOf([
    'orange',
    'green',
    'red',
    'blue',
    'purple',
    'grey',
  ]),
  cardTitle: PropTypes.node,
  cardSubtitle: PropTypes.node,
  content: PropTypes.node,
  plainContent: PropTypes.bool,
  footer: PropTypes.node,
};

export default withStyles(regularCardStyle)(RegularCard);
