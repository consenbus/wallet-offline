/**
 * {
 *   [hash]: {
 *     state: 'pending', // pending | done
 *     work: '12ab94bc9332f0' // work result when state equal done
 *   }
 * }
 */

/* eslint-disable no-undef */

const dict = {};

const NUM_THREADS = 3;
const workers = pow_initiate(NUM_THREADS, '/js/pow-wasm/');

const createTask = async (hash) => {
  const work = { state: 'pending', spent_MS: 0 };
  const promise = new Promise((resolve) => {
    let start = 0;
    pow_callback(workers, hash, () => {
      start = Date.now();
    }, (data) => {
      work.work = data;
      work.spend_MS = Date.now() - start;
      resolve(data);
    });
  });
  work.promise = promise;
  dict[hash] = work;

  return promise;
};

const get = async (hash) => {
  if (dict[hash]) {
    const work = dict[hash];
    if (work.state === 'done') return work.work;
    return work.promise;
  }

  return createTask(hash);
};

export default get;
/* eslint-enable no-undef */
