const _functions = require('./functions');
const nacl = require('./nacl'); // We are using a forked version of tweetnacl, so need to import nacl
const blake = require('blakejs');

const fieldDict = {
  send: ['previous', 'destination', 'balance'],
  open: ['source', 'representative', 'account'],
  receive: ['previous', 'source'],
  change: ['previous', 'destination', 'balance'],
};

function sign(params, privateKey) {
  const fields = fieldDict[params.type];
  if (!fields) throw new Error('Unkonw block type');

  const context = blake.blake2bInit(32, null);
  fields.forEach((field) => {
    blake.blake2bUpdate(context, (0, _functions.hex_uint8)(params[field]));
  });

  const hash = (0, _functions.uint8_hex)(blake.blake2bFinal(context));

  const xhash = (0, _functions.hex_uint8)(hash);
  const xkey = (0, _functions.hex_uint8)(privateKey);
  // console.log(hash, xhash);
  const xsign = nacl.sign.detached(xhash, xkey);
  return (0, _functions.uint8_hex)(xsign);
}

module.exports = sign;
