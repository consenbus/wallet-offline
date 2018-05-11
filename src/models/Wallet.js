import { extendObservable } from 'mobx';
import _times from 'lodash/times';
import ConsenbusWalletCore from 'consenbus-wallet-core';
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
  mnemonic: null,
  entropy: null,
  accounts: [], // accounts [[address, publicKey], ...]
  currentIndex: 0, // current Index max value is 10
  currentBalance: 0, // balance of current selected account
  currentHistory: [], // trade log of current selected account
});

const changeCurrent = (index) => {
  if (index >= 0 && index <= 9) {
    wallet.currentIndex = index;
  } else {
    wallet.error = Error('The minimum value of index is 0 and the maximum is 9.');
  }
};

const initialize = (password, pin) => {
  try {
    wallet.core = ConsenbusWalletCore(password, pin, reader, writer);
  } catch (e) {
    wallet.error = Error('The password is incorrect or the temporary data is corrupted. Please re-enter the password or click Restore/Generate button.');
  }
};

const generate = () => {
  try {
    wallet.core.generate();
    wallet.accounts = _times(10, i => [wallet.core.getAddress(i), wallet.core.getPublicKey(i)]);
    changeCurrent(0);
  } catch (e) {
    wallet.error = e;
  }
};

const backupFromMnemonic = (password, language) => {
  try {
    wallet.mnemonic = wallet.core.backupFromMnemonic(password, language);
  } catch (e) {
    wallet.error = e;
  }
};

const backupFromEntropy = (password) => {
  try {
    wallet.entropy = wallet.core.backupFromEntropy(password);
  } catch (e) {
    wallet.error = e;
  }
};

const restoreFromMnemonic = (mnemonic, language) => {
  try {
    wallet.core.restoreFromMnemonic(mnemonic, language);
  } catch (e) {
    wallet.error = e;
  }
};

const restoreFromEntropy = (entropy) => {
  try {
    wallet.core.restoreFromEntropy(entropy);
  } catch (e) {
    wallet.error = e;
  }
};

const isExists = () => !!reader();

const clearTempData = () => {
  wallet.error = null;
  writer('');
};

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
});

export default wallet;
