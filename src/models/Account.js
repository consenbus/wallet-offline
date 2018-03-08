import { extendObservable } from "mobx";
import rpc from "../utils/rpc";
import store from "../utils/store";
import Wallet from "../utils/wallet";
import _isEmpty from "lodash/isEmpty";
import _merge from "lodash/merge";
import _each from "lodash/each";

class Account {
  constructor() {
    extendObservable(this, {
      loading: false,
      accounts: [],
      currentAccount: {},
      currentHistory: {},
      createLoading: false
    });
    this.wallet = null;
  }

  hasAccounts() {
    return !_isEmpty(this.accounts);
  }

  createAccount(name, password) {
    this.createLoading = true;

    // generate seed and key
    this.wallet = new Wallet(password);
    const seed = this.wallet.createWallet();
    const pack = this.wallet.pack();
    const seedb = this.wallet.encrypt(seed, password);
    const data = { name, seed: seedb, pack };
    const accounts = this.wallet.getAccounts();
    const account = accounts[0].account;

    return store
      .setItem("wallet-offline", data)
      .then(() => {
        this.accounts = accounts;
        this.createLoading = false;
        return this.getAccountBlocks(account);
      })
      .then(res => {
        // update wallet blocks
        _each(res.data.history, block => {
          const blk = this.wallet.newBlock(block, account);
          this.wallet.importBlock(blk, account, false);
        });
        this.wallet.useAccount(account);
        data.pack = this.wallet.pack();
        return store.setItem("wallet-offline", data);
      })
      .then(() => {
        // pow
        this.wallet.clientPoW(() => {
          console.log("clientPoW callback");
        });
      });
  }

  getAccountBlocks(account) {
    return rpc.post("/", {
      action: "account_history",
      account,
      count: 1000
    });
  }

  loadAccounts() {
    if (this.hasAccounts()) {
      return;
    }

    this.loading = true;
    store.getItem("accounts").then(accounts => {
      this.accounts = accounts || [];
      this.loading = false;
    });
  }

  getAccountBalance(account) {
    rpc.post("/", { action: "account_balance", account }).then(res => {
      this.currentAccount = _merge({}, this.currentAccount, res.data);
    });
  }

  getAccountHistory(account) {
    rpc
      .post("/", { action: "account_history", account, count: 100 })
      .then(res => {
        this.currentHistory = res.data;
      });
  }
}

export default Account;
