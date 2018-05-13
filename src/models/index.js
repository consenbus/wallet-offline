import Block from './Block';
import Account from './Account';
import wallet from './Wallet';

const models = {
  wallet,
  block: new Block(),
  account: new Account(),
};

export default models;
