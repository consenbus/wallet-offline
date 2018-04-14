const _functions = require('./functions');
const nacl = require('./nacl'); // We are using a forked version of tweetnacl, so need to import nacl
const blake = require('blakejs');

function sendSign({ previous, destination, balance }, privateKey) {
  console.log(previous, destination, balance);
  const context = blake.blake2bInit(32, null);
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(previous));
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(destination));
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(balance));
  const hash = (0, _functions.uint8_hex)(blake.blake2bFinal(context));

  const xhash = (0, _functions.hex_uint8)(hash);
  const xkey = (0, _functions.hex_uint8)(privateKey);
  // console.log(hash, xhash);
  const xsign = nacl.sign.detached(xhash, xkey);
  return (0, _functions.uint8_hex)(xsign);
}

function receiveSign({ previous, destination, balance }, privateKey) {
  const context = blake.blake2bInit(32, null);
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(previous));
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(destination));
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(balance));
  const hash = (0, _functions.uint8_hex)(blake.blake2bFinal(context));

  const xkey = (0, _functions.hex_uint8)(privateKey);
  // console.log(hash, xhash);
  const xsign = nacl.sign.detached(hash, xkey);
  return (0, _functions.uint8_hex)(xsign);
}

function openSign({ previous, destination, balance }, privateKey) {
  const context = blake.blake2bInit(32, null);
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(previous));
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(destination));
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(balance));
  const hash = (0, _functions.uint8_hex)(blake.blake2bFinal(context));

  const xhash = (0, _functions.hex_uint8)(hash);
  const xkey = (0, _functions.hex_uint8)(privateKey);
  // console.log(hash, xhash);
  const xsign = nacl.sign.detached(xhash, xkey);
  return (0, _functions.uint8_hex)(xsign);
}

function changeSign({ previous, destination, balance }, privateKey) {
  const context = blake.blake2bInit(32, null);
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(previous));
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(destination));
  blake.blake2bUpdate(context, (0, _functions.hex_uint8)(balance));
  const hash = (0, _functions.uint8_hex)(blake.blake2bFinal(context));

  const xhash = (0, _functions.hex_uint8)(hash);
  const xkey = (0, _functions.hex_uint8)(privateKey);
  // console.log(hash, xhash);
  const xsign = nacl.sign.detached(xhash, xkey);
  return (0, _functions.uint8_hex)(xsign);
}

export default function sign(params, privateKey) {
  if (params.type === 'send') return sendSign(params, privateKey);
  if (params.type === 'receive') return receiveSign(params, privateKey);
  if (params.type === 'open') return openSign(params, privateKey);
  if (params.type === 'change') return changeSign(params, privateKey);
  throw new Error('Unkonw block type');
}
