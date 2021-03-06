import { extendObservable } from "mobx";
import _times from "lodash/times";
import _each from "lodash/each";
import _once from "lodash/once";
import ConsenbusWalletCore from "consenbus-wallet-core";
import rpc from "../utils/rpc";
import store from "../utils/store";
import pow from "../utils/pow";
import converter from "../utils/converter";

const {
  wallet: { publicKeyFromAddress },
  fns: { dec2hex }
} = ConsenbusWalletCore;

/* for test network
const representatives = [
  "bus_1ab5my7fag39ebekw9fe4i3gb79awic3bs85ydr54bmjs66mh36mwbsko8zt",
  "bus_3p3jgbfrq6aary8tdmqb35kokath6sjs1znqaikd74bdf8398gjokhkcga9y",
  "bus_1g4qwxxajtkykspxe58bh9iy8i47m8ccakpwxjogjet3abhspc8co88b5o1j",
  "bus_351ffswqxn3x8pw4b93oyewznjq83zm3jfdxc6ahciqm8cgueqyqkq56t3by",
  "bus_3kkg3wq1jje5914e9ee4nxnuabs785cardpuete89816gq6x5e9p7b5szkf1"
];
*/

/* for live network */
const representatives = [
  "bus_33qn4ryurfbutporn3uxeax7zqk3wtuyo7hae1nbcpnjz4w39g85spwamz3o", // 193.112.86.25
  "bus_3zmfjsqnifgiwondh9ejfh8guexhphj8gsquofej8dc1ok734o15tig8oqik", // 118.24.165.152
  "bus_19gjfegxfibnpf5hnm9rg7nfxh7qpz9kdkzeykorcpnemrq7x7165cqsfagq", // 118.24.108.183
  "bus_3u5bpg1cas74ifms1soyp5q1kwtwmtda4on94txhko3cofzegth9pcxi1ezh", // 193.112.95.108
  "bus_3gyito6pf5pg385nqre7tdbxgbzoi6doq89t5cukxiyiyuqfxwmm8agfu6o7", // 111.230.193.136
  "bus_3jxupp817mjwwdj84sdz8udud6bwgwrujbq8xi4ma5ggkq8o36fdd4386ygg", // 150.109.47.190
  "bus_37wcfcpqp9iymf8anwy78f7kktrcoffz39a7d1ki8gerfhuhpr964bbe7bmd", // 150.109.46.150
  "bus_1quihhar9nak47k3wet7tub7c8m1qmo4mur9te7sqnt5tr9a6tmcixwef5g1", // 47.254.45.34
  "bus_3tykg6otbctreian7poen8c8zp1t3ssh8ynsffwefddwqwepdjjqz3so5r7k", // 58.87.125.39
  "bus_1i4wmotbfdbgzrdtudj31qcfqohjfqkb8hhq1ndna74ke66gb339bmg6oqmp", // 47.254.129.191
  "bus_3zai1ujjrwzmi9ouatwshyk64ohsymthb66trh8a7mr75xb9e7aifirytpof", // 47.91.45.135
  "bus_3pmqawfctzz196yr96tb4ft37fyc5jujo8itp1s49tfqttuopj7s3h7zb8os" // 119.3.29.62
];

const getRandRepresentative = () => {
  const randIndex = Math.floor(representatives.length * Math.random());
  return representatives[randIndex];
};

const storeKeys = {
  wallet: "consenbus/wallet-offline"
};

const wallet = {};
extendObservable(wallet, {
  core: null,
  error: null,
  accounts: [], // accounts [[address, publicKey], ...]
  accountLoading: false, // account info load status
  historyLoading: false, // account history load status
  currentIndex: 0, // current Index max value is 10
  currentBalance: 0, // balance of current selected account
  currentInfo: {}, // current account info
  pendings: [], // 待接收交易
  currentHistory: [] // trade log of current selected account
});

function reader() {
  return localStorage[storeKeys.wallet];
}

function writer(encrypted) {
  localStorage[storeKeys.wallet] = encrypted;
}

async function pullAccountInfo(index) {
  const { accounts, currentIndex } = wallet;
  wallet.accountLoading = true;
  if (accounts.length === 0) return {};
  const [address, publicKey] = accounts[index];
  const { data } = await rpc.post("/", {
    action: "account_info",
    account: address
  });
  wallet.accountLoading = false;
  if (!data.error) {
    // update current account
    if (currentIndex === index) wallet.currentInfo = data;
    // save to store
    store.setItem(`accountInfo_${index}`, data);
  }

  // pre calc pow
  pow(data.frontier || publicKey);
  return data;
}

async function pullHistoryList(index) {
  const { accounts, currentIndex } = wallet;
  if (accounts.length === 0) return;
  wallet.historyLoading = true;
  const [address] = accounts[index];
  const { data } = await rpc.post("/", {
    action: "account_history",
    account: address,
    count: 500
  });
  wallet.historyLoading = false;
  if (Array.isArray(data.history)) {
    if (index === currentIndex) wallet.currentHistory = data.history;
    store.setItem(`history_${index}`, data.history);
  }
}

async function getRepresentative() {
  const { currentIndex, accounts } = wallet;
  const [address] = accounts[currentIndex];
  const { data } = await rpc.post("/", {
    account: address,
    action: "account_representative"
  });

  return data.representative;
}

async function changeRepresentative(representativer, password) {
  const { currentIndex, core, currentInfo: info } = wallet;

  if (!info.frontier) throw Error("Account not found");

  // Step 3. Generate Proof of Work from your account's frontier
  const work = await pow(info.frontier);

  // Step 4. Generate a send block
  const block = {
    type: "change",
    previous: info.frontier,
    representative: publicKeyFromAddress(representativer),
    work
  };

  const signature = core.signature(password, currentIndex, block);
  // Step 5. Publish your send block to the network using "process"
  const body = {
    action: "process",
    block: JSON.stringify({
      type: "change",
      previous: block.previous,
      representative: representativer,
      work,
      signature
    })
  };

  const res = await rpc.post("/", body);

  if (res.data.error) {
    console.error(res);
    throw Error(res.data.error);
  }

  // push the newist hash to pow calc pool
  pow(res.data.hash);

  pullHistoryList(currentIndex);
  pullAccountInfo(currentIndex);

  return res;
}

async function send(amount, unit, toAccountAddress, password) {
  const { core, currentIndex } = wallet;

  // Step 1. Convert amount to raw 128-bit stringified integer. Since converion
  const rawAmount = converter.unit(amount, unit, "raw");

  // Step 2. Retrieve your account info to get your latest block hash (frontier)
  // and balance
  const info = await pullAccountInfo(currentIndex);

  // verify rawAmount lte info.balance
  const balance = converter.sentBalance(info.balance, rawAmount);

  // Step 3. Generate Proof of Work from your account's frontier
  const work = await pow(info.frontier);

  // Step 4. Generate a send block
  const block = {
    type: "send",
    previous: info.frontier,
    destination: publicKeyFromAddress(toAccountAddress),
    balance: dec2hex(balance, 16).toUpperCase(),
    work
  };

  const signature = core.signature(password, currentIndex, block);
  // Step 5. Publish your send block to the network using "process"
  const res = await rpc.post("/", {
    action: "process",
    block: JSON.stringify({
      type: "send",
      previous: block.previous,
      destination: toAccountAddress,
      balance: block.balance,
      work,
      signature
    })
  });

  if (res.data.error) {
    console.error(res);
    throw Error(res.data.error);
  }

  // push the newist hash to pow calc pool
  pow(res.data.hash);

  pullHistoryList(currentIndex);
  pullAccountInfo(currentIndex);

  return res;
}

async function receive() {
  const { core, pendings } = wallet;
  if (!core || !core.exists()) return;
  if (pendings.length === 0) return;
  const pending = pendings.shift();
  if (!pending) return;

  const { index, address, publicKey, hash } = pending;

  // Step 1. Retrieve your account info to get your latest block hash (frontier)
  const info = await pullAccountInfo(index);

  const previous = info.frontier || publicKey;

  // Step 2. Generate Proof of Work from your account's frontier
  const work = await pow(previous);
  const representative = getRandRepresentative();

  // Step 3. Generate a open/receive block
  const block = {
    type: previous === publicKey ? "open" : "receive",
    account: publicKey,
    representative: publicKeyFromAddress(representative),
    source: hash,
    work
  };
  if (block.type !== "open") block.previous = previous;
  const signature = core.receiveSign(index, block);

  // Step 4. Publish your open block to the network using "process"
  const newBlock = {
    type: block.type,
    source: hash,
    account: address,
    previous,
    representative,
    work,
    signature
  };
  const res = await rpc.post("/", {
    action: "process",
    block: JSON.stringify(newBlock)
  });

  pullHistoryList(index);
  pullAccountInfo(index);

  // push newist hash to pow calc pool
  pow(res.data.hash);
}

async function pullPendings() {
  const { accounts } = wallet;
  if (accounts.length === 0) return;
  const {
    data: { blocks }
  } = await rpc.post("/", {
    action: "accounts_pending",
    accounts: accounts.map(([address]) => address),
    count: 100
  });
  const pendings = [];
  _each(accounts, ([address, publicKey], index) => {
    const _blks = blocks[address];
    if (!Array.isArray(_blks) || _blks.length === 0) return;
    const hash = _blks[0];
    pendings.push({
      address,
      publicKey,
      index,
      hash
    });
  });
  wallet.pendings = pendings;
}

function runner(fn, sleep, isCurrent = false) {
  async function goRun() {
    try {
      await fn(isCurrent && wallet.currentIndex);
    } catch (e) {
      console.error(e);
    }
    setTimeout(goRun, sleep);
  }
  return goRun;
}

const startUpdateTask = _once(() => {
  runner(pullHistoryList, 120 * 1000, true)();
  runner(pullPendings, 20 * 1000)();
  runner(pullAccountInfo, 300 * 1000, true)();
  runner(receive, 5 * 1000)();
});

function changeCurrent(index) {
  if (index >= 0 && index <= 9) {
    wallet.currentIndex = index;
    wallet.error = null;

    wallet.currentHistory = [];
    store.getItem(`history_${index}`, (error, list) => {
      if (error) return;
      if (!Array.isArray(list)) return;
      wallet.currentHistory = list;
    });
    wallet.currentInfo = {};
    store.getItem(`accountInfo_${index}`, (error, info) => {
      if (error || !info) return;
      wallet.currentInfo = info || {};
    });

    store.setItem("currentIndex", index);
    pullAccountInfo(index);
    pullHistoryList(index);
  } else {
    wallet.error = Error(
      "The minimum value of index is 0 and the maximum is 9."
    );
  }
}

function makeAccounts() {
  if (!wallet.core || !wallet.core.exists()) return;
  wallet.accounts = _times(10, i => [
    wallet.core.getAddress(i),
    wallet.core.getPublicKey(i)
  ]);

  store.getItem("currentIndex", (error, index) => {
    changeCurrent(index | 0);
    startUpdateTask();
  });
}

function initialize(password, salt) {
  try {
    wallet.core = ConsenbusWalletCore(password, salt, reader, writer);
  } catch (error) {
    wallet.error = error;
    return;
  }
  wallet.error = null;
  makeAccounts();
}

function generate() {
  try {
    wallet.core.generate();
    makeAccounts();
    wallet.error = null;
  } catch (e) {
    wallet.error = e;
  }
}

function backupFromMnemonic(password, language) {
  try {
    const mnemonic = wallet.core.backupFromMnemonic(password, language);
    wallet.error = null;
    return mnemonic;
  } catch (e) {
    wallet.error = e;
  }
  return false;
}

function backupFromEntropy(password) {
  try {
    const entropy = wallet.core.backupFromEntropy(password);
    wallet.error = null;
    return entropy;
  } catch (e) {
    wallet.error = e;
  }
  return false;
}

function restoreFromMnemonic(mnemonic, language) {
  try {
    wallet.core.restoreFromMnemonic(mnemonic, language);
    makeAccounts();
    wallet.error = null;
  } catch (e) {
    wallet.error = e;
  }
}

function restoreFromEntropy(entropy) {
  try {
    wallet.core.restoreFromEntropy(entropy);
    makeAccounts();
    wallet.error = null;
  } catch (e) {
    wallet.error = e;
  }
}

function isExists() {
  return !!reader();
}

function clearTempData() {
  wallet.error = null;
  writer("");
  _times(10, index => {
    store.setItem(`history_${index}`, "");
    store.setItem(`accountInfo_${index}`, "");
  });
  store.setItem("wallet-works", "");
  store.setItem("currentIndex", 0);
}

function logout(password) {
  if (wallet.core) {
    try {
      wallet.core.logout(password);
      clearTempData();
    } catch (e) {
      wallet.error = e;
    }
  }
}

function languages() {
  return ConsenbusWalletCore.languages;
}

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
  languages,
  getRepresentative,
  changeRepresentative,
  send
});

export default wallet;
