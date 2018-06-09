/**
 * {
 *   [hash]: {
 *     state: 'pending', // pending | done
 *     work: '12ab94bc9332f0' // work result when state equal done
 *   }
 * }
 */

/* eslint-disable no-undef */
import blake from "blakejs";
import ConsenbusWalletCore from "consenbus-wallet-core";
import store from "./store";

const dict = {};
const {
  fns: { hex_uint8 }
} = ConsenbusWalletCore;

const t = hex_uint8("ffffc00000000000");
const check = (hash, work) => {
  const context = blake.blake2bInit(8, null);
  blake.blake2bUpdate(context, hex_uint8(work).reverse());
  blake.blake2bUpdate(context, hex_uint8(hash));
  const res = blake.blake2bFinal(context).reverse();

  if (res[0] === t[0]) if (res[1] === t[1]) if (res[3] >= t[3]) return true;
  return false;
};

const storeKey = "wallet-works";

const backup2Storage = () => {
  const works = [];
  Object.keys(dict).forEach(key => {
    const item = dict[key];
    if (item.state !== "done") return;
    works.push([key, item.work, item.completed]);
  });
  store.setItem(storeKey, works);
};

// micro seconds of one week
const expired = 7 * 86400 * 1000;
const restore = () => {
  const now = Date.now();
  store.getItem(storeKey).then(works => {
    if (!works) return;
    works.forEach(([hash, work, completed]) => {
      // ignore error work
      if (!check(hash, work)) return;
      // ignore too old item
      if (now - completed > expired) return;
      dict[hash] = {
        state: "done",
        work,
        completed,
        spent_MS: 0,
        promise: new Promise(resolve => {
          resolve(work);
        })
      };
    });
  });
};

const NUM_THREADS = NaN;

const createTask = hash => {
  const work = { state: "pending", spent_MS: 0 };
  dict[hash] = work;
  const promise = new Promise((resolve, reject) => {
    let start = 0;
    const workers = pow_initiate(NUM_THREADS, "/js/pow-wasm/");
    pow_callback(
      workers,
      hash,
      () => {
        start = Date.now();
        console.log("Pow calc hash is: %s, startedAt: %d", hash, start);
      },
      data => {
        if (!check(hash, data)) {
          return reject(Error("Click to recalc work, please"));
        }
        work.state = "done";
        work.work = data;
        work.completed = Date.now();
        work.spent_MS = Date.now() - start;

        console.log(
          "Pow calc hash is: %s, work is: %s, spent_MS: %d, started: %d, completed: %d",
          hash,
          data,
          work.spent_MS,
          start,
          Date.now()
        );
        resolve(data);

        // write into localStorage for quick to get
        return setTimeout(backup2Storage, 10);
      }
    );
  });
  work.promise = promise;

  return promise;
};

const get = async hash => {
  if (!hash) return null;
  if (dict[hash]) {
    const work = dict[hash];
    if (work.state === "done") return work.work;
    return work.promise;
  }

  return createTask(hash);
};

window.__powCalcPool = dict;
window.__pow = get;

// Auto restore from localStorage
restore();

export default get;
/* eslint-enable no-undef */
