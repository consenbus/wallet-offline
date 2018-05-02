import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { Provider } from 'mobx-react';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import blue from 'material-ui/colors/blue';
import grey from 'material-ui/colors/grey';
import 'typeface-roboto';
import models from './models';

// Styles
// import "semantic-ui-css/semantic.css";
import './assets/css/index.css';

// Modules
import CheckAccountRoute from './containers/Home/_CheckAccount';
import Home from './containers/Home';
import Explorer from './containers/Explorer';
import Guide from './containers/Guide';

const history = createBrowserHistory();
const theme = createMuiTheme({
  palette: {
    primary: {
      main: blue.A700,
    },
    secondary: grey,
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  },
});

ReactDOM.render(
  <Provider {...models}>
    <MuiThemeProvider theme={theme}>
      <Router history={history}>
        <Switch>
          <Route path="/guide" component={Guide} />
          <Route path="/explorer" component={Explorer} />
          <CheckAccountRoute path="/" component={Home} />
        </Switch>
      </Router>
    </MuiThemeProvider>
  </Provider>,
  document.getElementById('root'),
);
