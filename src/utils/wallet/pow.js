var functions = require("./functions");

const pow = {};

pow.pow_initiate = (threads, worker_path) => {
  if (typeof worker_path === "undefined") {
    worker_path = "js/pow-wasm/";
  }
  if (isNaN(threads)) {
    threads = window.navigator.hardwareConcurrency - 1;
  }
  let workers = [];
  for (let i = 0; i < threads; i++) {
    workers[i] = new Worker(`${worker_path}thread.js`);
  }
  return workers;
};

pow.pow_start = (workers, hash) => {
  if (hash instanceof Uint8Array && hash.length === 32) {
    const threads = workers.length;
    for (let i = 0; i < threads; i++) {
      workers[i].postMessage(hash);
    }
  }
};

pow.pow_terminate = workers => {
  const threads = workers.length;
  for (let i = 0; i < threads; i++) {
    workers[i].terminate();
  }
};

pow.pow_callback = (workers, hash, ready, callback) => {
  if (hash.length === 64 && typeof callback === "function") {
    const threads = workers.length;
    for (let i = 0; i < threads; i++) {
      workers[i].onmessage = e => {
        var result = e.data;
        if (result === "ready") {
          workers[i].postMessage(hash);
          ready();
        } else if (result !== false && result !== "0000000000000000") {
          pow.pow_terminate(workers);
          callback(result);
        } else workers[i].postMessage(hash);
      };
    }
  }
};

// hash_hex input as text, callback as function
pow.run = (hash_hex, threads, callback, worker_path) => {
  const isValid = /^[0123456789ABCDEF]+$/.test(hash_hex);
  if (isValid && hash_hex.length === 64) {
    const hash = functions.hex_uint8(hash_hex);
    let workers = pow.pow_initiate(threads, worker_path);
    pow.pow_start(workers, hash);
    pow.pow_callback(
      workers,
      hash,
      function() {
        console.log("Working locally on " + hash);
      },
      callback
    );
  } else {
    throw new Error("Invalid hash:", hash_hex);
  }
};

export default pow;
