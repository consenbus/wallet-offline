import Example from './Example';
import Block from './Block';
import Account from './Account';
import wallet from './Wallet';

const models = {
  wallet,
  example: new Example(),
  block: new Block(),
  account: new Account(),
};

export default models;
