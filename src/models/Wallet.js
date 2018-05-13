import { extendObservable } from 'mobx';
import _times from 'lodash/times';
import _each from 'lodash/each';
import ConsenbusWalletCore from 'consenbus-wallet-core';
import rpc from '../utils/rpc';
import store from '../utils/store';
import pow from '../utils/wallet/pow';
// import converter from '../utils/converter';
const { wallet: { publicKeyFromAddress } } = ConsenbusWalletCore;

const representative = 'bus_1zrzcmckjhjcpcepmuua8fyqiq4e4exgt1ruxw4hymgfchiyeaa536w8fyot';

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
  pendings: [], // 待接收交易
  currentHistory: [], // trade log of current selected account
});

const receive = async () => {
  const { core, pendings } = wallet;
  if (!core || !core.exists()) return;
  if (pendings.length === 0) return;
  const pending = pendings.shift();
  if (!pending) return;

  const {
    index, address, publicKey, hash,
  } = pending;

  // Step 1. Retrieve your account info to get your latest block hash (frontier)
  const info = await rpc.post('/', {
    action: 'account_info',
    account: address,
    count: 1,
  });

  const previous = info.data.frontier || publicKey;

  console.log(info);
  // Step 2. Generate Proof of Work from your account's frontier
  const work = await pow(previous);

  console.log(work);
  console.log('publicKeyFromAddress', publicKeyFromAddress, 'sss');
  // Step 3. Generate a open/receive block
  const block = {
    type: previous === publicKey ? 'open' : 'receive',
    account: publicKey,
    representative: publicKeyFromAddress(representative),
    source: hash,
    work,
  };
  console.log(publicKeyFromAddress);
  if (block.type !== 'open') block.previous = previous;
  const signature = core.receiveSign(index, block);

  // Step 4. Publish your open block to the network using "process"
  const newBlock = {
    type: block.type,
    source: hash,
    account: address,
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
};

const pullHistoryList = async () => {
  const { accounts, currentIndex: index } = wallet;
  const [address] = accounts[index];
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

const pullPendings = async () => {
  const { accounts } = wallet;
  const { data: { blocks } } = await rpc.post('/', {
    action: 'accounts_pending',
    accounts: accounts.map(([address]) => address),
    count: 100,
  });
  const pendings = [];
  _each(accounts, ([address, publicKey], index) => {
    const _blks = blocks[address];
    if (!Array.isArray(_blks) || _blks.length === 0) return;
    const hash = _blks[0];
    pendings.push({
      address, publicKey, index, hash,
    });
  });
  wallet.pendings = pendings;
};

// 自动拉取数据
const pull = async () => {
  if (!wallet.core || !wallet.core.exists()) return;
  await pullHistoryList();

  // pull accounts_pending
  await pullPendings();
};

const receiver = async () => {
  try {
    await receive();
  } catch (e) {
    console.error(e);
  }
  setTimeout(receiver, 5 * 1000);
};
receiver();

const runner = async () => {
  try {
    await pull();
  } catch (e) {
    console.error(e);
  }
  setTimeout(runner, 10 * 1000);
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
