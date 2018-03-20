const { blake2bInit, blake2bUpdate, blake2bFinal } = require('blakejs');

const value = process.argv[2];
const test = process.argv[3];

console.log('Hash is: %s, Work is %s', value, test);

const MAIN_NET_WORK_THRESHOLD = 'ffffffc000000000';

function hexUint8(hex) {
  const length = hex.length / 2 | 0;
  const uint8 = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    uint8[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return uint8;
}


const check = (hash, work) => {
  const t = (0, hexUint8)(MAIN_NET_WORK_THRESHOLD);
  const context = blake2bInit(8, null);
  blake2bUpdate(context, (0, hexUint8)(work).reverse());
  blake2bUpdate(context, (0, hexUint8)(hash));
  const threshold = blake2bFinal(context).reverse();

  console.log(threshold);
  console.log(hexUint8(work));
  console.log(hexUint8(hash));

  return (
    threshold[0] === t[0]
    && threshold[1] === t[1]
    && threshold[2] === t[2]
    && threshold[3] >= t[3]
  );
};

console.log(check(value, test));
