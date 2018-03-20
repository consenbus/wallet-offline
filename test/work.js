const { blake2bInit, blake2bUpdate, blake2bFinal } = require('blakejs');
const getRandomValues = require('get-random-values');

const value = process.argv[2];
const test = process.argv[3];

console.log('Hash is: %s, Work is %s', value, test);

// static uint64_t const publish_full_threshold = 0xffffffc000000000
function threshold(u) {
  return u[0] === 255 && u[1] === 255 && u[2] === 255 && u[3] >= 192;
}

function hexUint8(hex) {
  const length = hex.length / 2 | 0;
  const uint8 = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    uint8[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return uint8;
}

function uint8Hex(uint8) {
  let hex = '';
  let aux;
  for (let i = 0; i < uint8.length; i += 1) {
    aux = uint8[i].toString(16);
    if (aux.length === 1) aux = `0${aux}`;
    hex += aux;
    aux = '';
  }
  return hex;
}

function randomUint() {
  const array = new Uint8Array(8);
  getRandomValues(array);
  return array;
}

function generator256(hash) {
  const random = randomUint();
  for (let r = 0; r < 256; r += 1) {
    random[7] = r; // pseudo random part
    const context = blake2bInit(8, null);
    blake2bUpdate(context, random);
    blake2bUpdate(context, hash);
    const blakeRandom = blake2bFinal(context).reverse();
    const check = threshold(blakeRandom);
    // console.log(blakeRandom);
    // return random.reverse();
    if (check === true) {
      console.log(random, uint8Hex(random));
      console.log(random.reverse(), uint8Hex(random.reverse()));
      return random.reverse();
    }
  }
  return false;
}

const main = (hash) => {
  console.log('re-random-4096');
  for (let i = 0; i < 4096; i += 1) {
    const generate = generator256(hash);
    if (generate) {
      return generate; // Worker return
    }
  }
  return main(hash);
};

const check = (hash, work) => {
  const context = blake2bInit(8, null);
  blake2bUpdate(context, hexUint8(work).reverse());
  blake2bUpdate(context, hexUint8(hash));
  const blakeRandom = blake2bFinal(context).reverse();
  console.log(hexUint8(work));
  return threshold(blakeRandom);
};

console.log(check(value, test));

console.log(uint8Hex(main(hexUint8(value))).toLowerCase());
