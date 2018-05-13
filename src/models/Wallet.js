import { extendObservable } from 'mobx';
import _times from 'lodash/times';
import ConsenbusWalletCore from 'consenbus-wallet-core';
import rpc from '../utils/rpc';
import store from '../utils/store';
// import converter from '../utils/converter';

// let representative = 'bus_1zrzcmckjhjcpcepmuua8fyqiq4e4exgt1ruxw4hymgfchiyeaa536w8fyot';

const storeName = 'consenbus/wallet-offline';

const reader = () => localStorage[storeName];

const writer = (encrypted) => {
  localStorage[storeName] = encrypted;
};

const wallet = {};

extendObservable(wallet, {
  core: null,
  error: null,
  name: null,
  accounts: [], // accounts [[address, publicKey], ...]
  currentIndex: 0, // current Index max value is 10
  currentBalance: 0, // balance of current selected account
  pending: [], // 待接收交易
  currentHistory: [], // trade log of current selected account
});

// 自动拉取数据
const pull = async () => {
  if (!wallet.core || !wallet.core.exists()) return;
  const { accounts, currentIndex: index } = wallet;
  const [address, publicKey] = accounts[index];
  const { data } = await rpc.post('/', {
    action: 'account_history',
    account: address,
    count: 500,
  });
  if (Array.isArray(data.history)) {
    wallet.currentHistory = data.history;
    store.setItem(`history_${index}`, data.history);
  }
};

const runner = async () => {
  await pull();
  setTimeout(() => {
    runner();
  }, 30 * 1000);
};
runner();

const changeCurrent = (index) => {
  if (index >= 0 && index <= 9) {
    wallet.currentIndex = index;
    wallet.error = null;
    const storeKey = `history_${index}`;
    wallet.currentHistory = [];
    store.getItem(storeKey, (error, list) => {
      if (error) return;
      if (!Array.isArray(list)) return;
      wallet.currentHistory = list;
    });
  } else {
    wallet.error = Error('The minimum value of index is 0 and the maximum is 9.');
  }
};

const makeAccounts = () => {
  if (!wallet.core || !wallet.core.exists()) return;
  wallet.accounts = _times(10, i => [wallet.core.getAddress(i), wallet.core.getPublicKey(i)]);
  changeCurrent(0);
};

const initialize = (password, salt) => {
  try {
    wallet.core = ConsenbusWalletCore(password, salt, reader, writer);
  } catch (error) {
    wallet.error = error;
    return;
  }
  wallet.error = null;
  makeAccounts();
};

const generate = () => {
  try {
    wallet.core.generate();
    makeAccounts();
    wallet.error = null;
  } catch (e) {
    wallet.error = e;
  }
};

const backupFromMnemonic = (password, language) => {
  try {
    const mnemonic = wallet.core.backupFromMnemonic(password, language);
    wallet.error = null;
    return mnemonic;
  } catch (e) {
    wallet.error = e;
  }
  return false;
};

const backupFromEntropy = (password) => {
  try {
    const entropy = wallet.core.backupFromEntropy(password);
    wallet.error = null;
    return entropy;
  } catch (e) {
    wallet.error = e;
  }
  return false;
};

const restoreFromMnemonic = (mnemonic, language) => {
  try {
    wallet.core.restoreFromMnemonic(mnemonic, language);
    makeAccounts();
    wallet.error = null;
  } catch (e) {
    wallet.error = e;
  }
};

const restoreFromEntropy = (entropy) => {
  try {
    wallet.core.restoreFromEntropy(entropy);
    makeAccounts();
    wallet.error = null;
  } catch (e) {
    wallet.error = e;
  }
};

const isExists = () => !!reader();

const storeNameKey = 'consenbus/wallet-name';
const setName = (name) => {
  localStorage[storeNameKey] = name;
  wallet.name = name;
};

const getName = () => localStorage[storeNameKey];

const clearTempData = () => {
  wallet.error = null;
  setName('');
  writer('');
};

const logout = (password) => {
  if (wallet.core) {
    try {
      wallet.core.logout(password);
      wallet.error = null;
    } catch (e) {
      wallet.error = e;
    }
  }
};

const languages = () => ConsenbusWalletCore.languages;

Object.assign(wallet, {
  initialize,
  generate,
  backupFromMnemonic,
  backupFromEntropy,
  changeCurrent,
  restoreFromMnemonic,
  restoreFromEntropy,
  isExists,
  clearTempData,
  logout,
  setName,
  getName,
  languages,
});

export default wallet;
