import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';

import ExplorerIndex from './Explorer/Index';
import ExplorerBlock from './Explorer/Block';
import ExplorerAccount from './Explorer/Account';

// other
// import Example from "./Home/Example";
import NotFound from '../components/NotFound';

class Home extends Component {
  render() {
    return (
      <main className="main">
        <Switch>
          <Route path="/" exact component={ExplorerIndex} />

          {/* explorer */}
          <Route path="/explorer/accounts/:account" exact component={ExplorerAccount} />
          <Route path="/explorer/blocks/:hash" exact component={ExplorerBlock} />

          <Route component={NotFound} />
        </Switch>
      </main>
    );
  }
}

export default Home;
