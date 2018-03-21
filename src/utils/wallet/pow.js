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

const createTask = (hash) => {
  const work = { state: 'pending', spent_MS: 0 };
  dict[hash] = work;
  const promise = new Promise((resolve) => {
    let start = 0;
    const workers = pow_initiate(NUM_THREADS, '/js/pow-wasm/');
    pow_callback(workers, hash, () => {
      start = Date.now();
      console.log('Pow calc hash is: %s, startedAt: %d', hash, start);
    }, (data) => {
      work.state = 'done';
      work.work = data;
      work.spent_MS = Date.now() - start;

      console.log('Pow calc hash is: %s, work is: %s, spent_MS: %d, started: %d, completed: %d', hash, data, work.spent_MS, start, Date.now());
      resolve(data);
    });
  });
  work.promise = promise;

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

window.__powCalcPool = dict;
window.__pow = get;

export default get;
/* eslint-enable no-undef */
