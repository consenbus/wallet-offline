import blake from 'blakejs';
import { extendObservable } from 'mobx';
import _isEmpty from 'lodash/isEmpty';
import _merge from 'lodash/merge';
import _find from 'lodash/find';
import _map from 'lodash/map';
import _filter from 'lodash/filter';
import rpc from '../utils/rpc';
import pow from '../utils/wallet/pow';
import store from '../utils/store';
import converter from '../utils/converter';
import sign from '../utils/wallet/sign';
import nacl from '../utils/wallet/nacl';
import { dec2hex, uint8_hex, hex_uint8, encrypt, decrypt, accountFromHexKey, keyFromAccount } from '../utils/wallet/functions';

// const representative = 'bus_3h7qonaut7wkedquso3hakhpp79rp4bsysggtko519qm6bfrrua8dqbhge77';
let representative = 'bus_1zrzcmckjhjcpcepmuua8fyqiq4e4exgt1ruxw4hymgfchiyeaa536w8fyot';

// get public from seed
// throw exception if seed.length not equal 32
const newKeyFromSeed = (seed) => {
  if (seed.length !== 32) throw new Error('Seed lenght must be 32');

  const indexValue = 0;
  const index = (0, hex_uint8)((0, dec2hex)(indexValue, 4));

  const context = blake.blake2bInit(32);
  blake.blake2bUpdate(context, seed);
  blake.blake2bUpdate(context, index);

  const newKey = blake.blake2bFinal(context);
  const privateKey = (0, uint8_hex)(newKey);
  const publicKey = uint8_hex(nacl.sign.keyPair.fromSecretKey(newKey).publicKey);
  const address = accountFromHexKey(publicKey);

  return {
    private: privateKey,
    public: publicKey,
    account: address,
  };
};

let password = ''; // Current user password
const storeName = 'wallet-offline';
const passwordCharTypes = [
  /[0-9]/,
  /[a-z]/,
  /[A-Z]/,
  /[^0-9a-zA-Z]/,
];

class Account {
  constructor() {
    extendObservable(this, {
      loading: false,
      passwordError: null,
      passwordExists: false,
      accounts: [],
      currentAccount: {},
      currentHistory: {},
      currentBlock: {},
      createLoading: false,
    });
  }

  hasAccounts() {
    return !_isEmpty(this.accounts);
  }

  async createAccount(name) {
    this.createLoading = true;

    const seed = nacl.randomBytes(32);
    const keys = newKeyFromSeed(seed);

    const seedHex = uint8_hex(seed);
    this.saveAccount(name, keys, seedHex);
  }

  async restoreAccount(name, seed) {
    this.createLoading = true;
    const keys = newKeyFromSeed(hex_uint8(seed));
    this.saveAccount(name, keys, seed);
  }

  async saveAccount(name, keys, seed) {
    this.currentAccount = _merge(keys, { name, seed });
    this.accounts.push(this.currentAccount);
    await this.save2store();
    this.createLoading = false;
    return this.accounts;
  }

  async save2store() {
    const text = JSON.stringify(this.accounts);
    const encrypted = encrypt(text, password);
    await store.setItem(storeName, encrypted);
  }

  async getRepresentative() {
    const { currentAccount: { account } } = this;
    const { data } = await rpc.post('/', {
      account,
      action: 'account_representative',
    });

    return data.representative;
  }

  async change(representativer) {
    const account = this.currentAccount;

    // Step 2. Retrieve your account info to get your latest block hash (frontier)
    // and balance
    const info = await rpc.post('/', {
      action: 'account_info',
      account: account.account,
      count: 1,
    });

    // Step 3. Generate Proof of Work from your account's frontier
    const work = await pow(info.data.frontier);

    // Step 4. Generate a send block
    const block = {
      type: 'change',
      previous: info.data.frontier,
      representative: keyFromAccount(representativer),
      work,
    };

    const signature = sign(block, account.private);
    // Step 5. Publish your send block to the network using "process"
    const body = {
      action: 'process',
      block: JSON.stringify({
        type: 'change',
        previous: block.previous,
        representative: representativer,
        work,
        signature,
      }),
    };

    console.log(body);

    const res = await rpc.post('/', body);

    if (res.data.error) {
      console.error(res);
      throw new Error(res.data.error);
    }

    representative = representativer;

    // push the newist hash to pow calc pool
    pow(res.data.hash);

    return res;
  }

  async send(amount, unit, toAccountAddress) {
    const account = this.currentAccount;

    // Step 1. Convert amount to raw 128-bit stringified integer. Since converion
    const rawAmount = converter.unit(amount, unit, 'raw');

    // Step 2. Retrieve your account info to get your latest block hash (frontier)
    // and balance
    const info = await rpc.post('/', {
      action: 'account_info',
      account: this.currentAccount.account,
      count: 1,
    });

    // Step 3. Generate Proof of Work from your account's frontier
    const work = await pow(info.data.frontier);

    // Step 4. Generate a send block
    const block = {
      type: 'send',
      previous: info.data.frontier,
      destination: keyFromAccount(toAccountAddress),
      balance: dec2hex(converter.minus(info.data.balance, rawAmount), 16).toUpperCase(),
      work,
    };

    const signature = sign(block, account.private);
    // Step 5. Publish your send block to the network using "process"
    const res = await rpc.post('/', {
      action: 'process',
      block: JSON.stringify({
        type: 'send',
        previous: block.previous,
        destination: toAccountAddress,
        balance: block.balance,
        work,
        signature,
      }),
    });

    if (res.data.error) {
      console.error(res);
      throw new Error(res.data.error);
    }

    // push the newist hash to pow calc pool
    pow(res.data.hash);

    return res;
  }

  async setPassword(value) {
    password = value;
    try {
      Account.passwordVerify(value);
    } catch (error) {
      this.passwordError = error;
      return;
    }

    this.passwordExists = true;
    try {
      await this.loadAccounts();
    } catch (error) {
      this.passwordError = error;
      this.passwordExists = false;
    }
  }

  static passwordVerify(value) {
    if (value.length < 12) throw new Error('Password length at least 12 characters');
    if (_find(passwordCharTypes, regExp => !regExp.test(value))) throw new Error('Password must contain uppercase, lowercase, numbers, and special characters.');
  }

  static async getAccountBlocks(account) {
    const blocks = rpc.post('/', {
      action: 'account_history',
      account,
      count: 1000,
    });

    return blocks;
  }

  static async getOnePendingBlocks(address) {
    const { data } = await rpc.post('/', {
      action: 'accounts_pending',
      accounts: [address],
      count: 1,
    });

    if (!data.blocks) return false;

    const blocks = data.blocks[address];

    if (Array.isArray(blocks) && blocks.length > 0) return blocks[0];

    return false;
  }

  static async receive(account, sendBlockHash) {
    // Step 1. Retrieve your account info to get your latest block hash (frontier)
    const info = await rpc.post('/', {
      action: 'account_info',
      account: account.account,
      count: 1,
    });

    const previous = info.data.frontier || account.public;

    // Step 2. Generate Proof of Work from your account's frontier
    const work = await pow(previous);

    // Step 3. Generate a open/receive block
    const block = {
      type: previous === account.public ? 'open' : 'receive',
      account: keyFromAccount(account.account),
      representative: keyFromAccount(representative),
      source: sendBlockHash,
      work,
    };
    if (block.type !== 'open') block.previous = previous;
    const signature = sign(block, account.private);

    // Step 4. Publish your open block to the network using "process"
    const newBlock = {
      type: block.type,
      source: sendBlockHash,
      account: account.account,
      previous,
      representative,
      work,
      signature,
    };
    const res = await rpc.post('/', {
      action: 'process',
      block: JSON.stringify(newBlock),
    });

    // push newist hash to pow calc pool
    pow(res.data.hash);

    return res;
  }

  static async powPoolInit(account) {
    const info = await rpc.post('/', {
      action: 'account_info',
      account: account.account,
      count: 1,
    });
    const hash = info.data.frontier || account.public;

    pow(hash);
  }

  static async checkReadyBlocksByAccount(account) {
    const pending = await this.getOnePendingBlocks(account.account);

    if (pending) await Account.receive(account, pending);

    window.setTimeout(() => {
      this.checkReadyBlocksByAccount(account);
    }, 10 * 1000);
  }

  async accountInit() {
    this.accounts.forEach((account) => {
      Account.checkReadyBlocksByAccount(account);
      Account.powPoolInit(account);
    });
  }

  async loadAccounts() {
    if (password === '') {
      this.passwordExists = false;
      return null;
    }

    if (this.hasAccounts()) {
      this.currentAccount = this.accounts[0];
      return null;
    }

    this.loading = true;
    const encrypted = await store.getItem(storeName);
    if (!encrypted) {
      this.loading = false;
      return null;
    }
    let decrypted;
    try {
      decrypted = decrypt(encrypted, password);
    } catch (error) {
      throw new Error('Bad password, decryption failed. You can also choose to restore your account again.');
    }
    const accounts = JSON.parse(decrypted);
    this.accounts = _filter(accounts, x => !x.error) || [];
    this.currentAccount = this.accounts[0];
    this.loading = false;
    this.accountInit();
    return this.accounts;
  }

  changeCurrentAccount(account) {
    this.currentAccount = _find(this.accounts, a => a.account === account);
  }

  updateAccount(account, name) {
    if (this.currentAccount.account === account) {
      this.currentAccount = _merge({}, this.currentAccount, { name });
    }

    this.accounts = _map(this.accounts, (a) => {
      if (a.account === account) {
        a.name = name;
      }
      return a;
    });

    this.save2store();
  }

  deleteAccount(account) {
    this.accounts = _filter(this.accounts, a => a.account !== account);

    this.save2store();
  }

  getAccountBalance(account) {
    rpc.post('/', { action: 'account_balance', account }).then((res) => {
      this.currentAccount = _merge({}, this.currentAccount, res.data);
    });
  }

  getAccountHistory(account) {
    this.currentHistory = {};
    rpc
      .post('/', { action: 'account_history', account, count: 100 })
      .then((res) => {
        this.currentHistory = res.data;
      });
  }
}

export default Account;
