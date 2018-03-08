var pbkdf2 = require("pbkdf2");
var crypto = require("crypto");
var assert = require("assert");
var Block = require("./Block");
var Buffer = require("buffer").Buffer;
var blake = require("blakejs");
var bigInt = require("big-integer");
var Logger = require("./Logger");
var nacl = require("./nacl"); //We are using a forked version of tweetnacl, so need to import nacl
var functions = require("./functions");
var pow = require("./pow");

var MAIN_NET_WORK_THRESHOLD = "ffffffc000000000";
// var SUPPORTED_ENCRYPTION_VERSION = 3;
// var SALT_BYTES = 16;
// var KEY_BIT_LEN = 256;
var BLOCK_BIT_LEN = 128;

/*
var ALGO = {
  SHA1: "sha1",
  SHA256: "sha256"
};
*/

/*
var NoPadding = {
  pad: function(dataBytes) {
    return dataBytes;
  },

  unpad: function(dataBytes) {
    return dataBytes;
  }
};

var ZeroPadding = {

	// Fills remaining block space with 0x00 bytes
	// May cause issues if data ends with any 0x00 bytes


  pad: function(dataBytes, nBytesPerBlock) {
    var nPaddingBytes = nBytesPerBlock - dataBytes.length % nBytesPerBlock;
    var zeroBytes = new Buffer(nPaddingBytes).fill(0x00);
    return Buffer.concat([dataBytes, zeroBytes]);
  },

  unpad: function(dataBytes) {
    var unpaddedHex = dataBytes.toString("hex").replace(/(00)+$/, "");
    return new Buffer(unpaddedHex, "hex");
  }
};
*/

var Iso10126 = {
  /*
   *   Fills remaining block space with random byte values, except for the
   *   final byte, which denotes the byte length of the padding
   */

  pad: function(dataBytes, nBytesPerBlock) {
    var nPaddingBytes = nBytesPerBlock - dataBytes.length % nBytesPerBlock;
    var paddingBytes = crypto.randomBytes(nPaddingBytes - 1);
    var endByte = new Buffer([nPaddingBytes]);
    return Buffer.concat([dataBytes, paddingBytes, endByte]);
  },

  unpad: function(dataBytes) {
    var nPaddingBytes = dataBytes[dataBytes.length - 1];
    return dataBytes.slice(0, -nPaddingBytes);
  }
};

/*
var Iso97971 = {

  //  Fills remaining block space with 0x00 bytes following a 0x80 byte,
  //  which serves as a mark for where the padding begins

  pad: function(dataBytes, nBytesPerBlock) {
    var withStartByte = Buffer.concat([dataBytes, new Buffer([0x80])]);
    return ZeroPadding.pad(withStartByte, nBytesPerBlock);
  },

  unpad: function(dataBytes) {
    var zeroBytesRemoved = ZeroPadding.unpad(dataBytes);
    return zeroBytesRemoved.slice(0, zeroBytesRemoved.length - 1);
  }
};
*/

var AES = {
  CBC: "aes-256-cbc",
  OFB: "aes-256-ofb",
  ECB: "aes-256-ecb",

  /*
   *   Encrypt / Decrypt with aes-256
   *   - dataBytes, key, and salt are expected to be buffers
   *   - default options are mode=CBC and padding=auto (PKCS7)
   */

  encrypt: function(dataBytes, key, salt, options) {
    options = options || {};
    assert(Buffer.isBuffer(dataBytes), "expected `dataBytes` to be a Buffer");
    assert(Buffer.isBuffer(key), "expected `key` to be a Buffer");
    assert(
      Buffer.isBuffer(salt) || salt === null,
      "expected `salt` to be a Buffer or null"
    );

    var cipher = crypto.createCipheriv(
      options.mode || AES.CBC,
      key,
      salt || ""
    );
    cipher.setAutoPadding(!options.padding);

    if (options.padding)
      dataBytes = options.padding.pad(dataBytes, BLOCK_BIT_LEN / 8);
    var encryptedBytes = Buffer.concat([
      cipher.update(dataBytes),
      cipher.final()
    ]);

    return encryptedBytes;
  },

  decrypt: function(dataBytes, key, salt, options) {
    options = options || {};
    assert(Buffer.isBuffer(dataBytes), "expected `dataBytes` to be a Buffer");
    assert(Buffer.isBuffer(key), "expected `key` to be a Buffer");
    assert(
      Buffer.isBuffer(salt) || salt === null,
      "expected `salt` to be a Buffer or null"
    );

    var decipher = crypto.createDecipheriv(
      options.mode || AES.CBC,
      key,
      salt || ""
    );
    decipher.setAutoPadding(!options.padding);

    var decryptedBytes = Buffer.concat([
      decipher.update(dataBytes),
      decipher.final()
    ]);
    if (options.padding) decryptedBytes = options.padding.unpad(decryptedBytes);

    return decryptedBytes;
  }
};

var KEY_TYPE = {
  SEEDED: "seeded",
  EXPLICIT: "explicit"
};

export default function(password) {
  var api = {}; // wallet public methods
  var _private = {}; // wallet private methods

  var raiwalletdotcomRepresentative =
    "xrb_3pczxuorp48td8645bs3m6c3xotxd3idskrenmi65rbrga5zmkemzhwkaznh"; // self explaining

  var current; // current active key (shortcut for keys[currentIdx])
  var currentIdx = -1; // key being used
  var minimumReceive = bigInt(1); // minimum amount to pocket

  var keys = []; // wallet keys, accounts, and all necessary data
  var walletPendingBlocks = []; // wallet pending blocks
  var readyBlocks = []; // wallet blocks signed and worked, ready to broadcast and add to chain
  var errorBlocks = []; // blocks which could not be confirmed

  var remoteWork = []; // work pool

  var seed = ""; // wallet seed
  var lastKeyFromSeed = -1; // seed index
  var passPhrase = password; // wallet password
  var iterations = 5000; // pbkdf2 iterations
  var ciphered = true;
  var loginKey = false; // key to tell the server when the wallet was successfully decrypted
  var version = 2; // wallet version
  var lightWallet = false; // if true, partial chains can be stored, balances should be set from outside

  var logger = new Logger();

  api.debug = function() {
    console.log(readyBlocks);
  };

  api.debugChain = function() {
    api.useAccount(keys[1].account);
    for (let i in current.chain) {
      console.log(current.chain[i].getHash(true));
      console.log(current.chain[i].getPrevious());
    }
  };

  api.setLogger = function(loggerObj) {
    logger = loggerObj;
  };

  /**
   * Signs a message with the secret key
   *
   * @param {Array} message - The message to be signed in a byte array
   * @returns {Array} The 64 byte signature
   */
  api.sign = function(message) {
    const pk = current.priv;
    if (pk.length !== 32)
      throw new Error("Invalid Secret Key length. Should be 32 bytes.");
    return nacl.sign.detached(message, pk);
  };

  api.changePass = function(pswd, newPass) {
    if (ciphered) throw new Error("Wallet needs to be decrypted first.");
    if (pswd === passPhrase) {
      passPhrase = newPass;
      logger.log("Password changed");
    } else throw new Error("Incorrect password.");
  };

  api.setIterations = function(newIterationNumber) {
    newIterationNumber = parseInt(newIterationNumber, 10);
    if (newIterationNumber < 2)
      throw new Error("Minumum iteration number is 2.");

    iterations = newIterationNumber;
  };

  api.setMinimumReceive = function(raw_amount) {
    raw_amount = bigInt(raw_amount);
    if (raw_amount.lesser(0)) return false;
    minimumReceive = raw_amount;
    return true;
  };

  api.getMinimumReceive = function() {
    return minimumReceive;
  };

  /**
   * Sets a seed for the wallet
   *
   * @param {string} hexSeed - The 32 byte seed hex encoded
   * @throws An exception on malformed seed
   */
  api.setSeed = function(hexSeed) {
    if (!/[0-9A-F]{64}/i.test(hexSeed)) throw new Error("Invalid Hex Seed.");
    seed = functions.hex_uint8(hexSeed);
  };

  api.getSeed = function(pswd) {
    if (pswd === passPhrase) return functions.uint8_hex(seed);
    throw new Error("Incorrect password.");
  };

  /**
   * Sets a random seed for the wallet
   *
   * @param {boolean} overwrite - Set to true to overwrite an existing seed
   * @throws An exception on existing seed
   */
  api.setRandomSeed = function(overwrite = false) {
    if (seed && !overwrite)
      throw new Error(
        "Seed already exists. To overwrite use setSeed or set overwrite to true"
      );
    seed = nacl.randomBytes(32);
  };

  _private.addKey = function(o) {
    let key = {
      account: functions.accountFromHexKey(functions.uint8_hex(o.pub)),
      balance: bigInt(0),
      pendingBalance: bigInt(0),
      lastBlock: "",
      lastPendingBlock: "",
      pendingBlocks: [],
      subscribed: false,
      chain: [],
      representative: "",
      label: ""
    };
    for (let k in o) {
      key[k] = o[k];
    }
    keys.push(key);
    return key;
  };

  _private.newKeyDataFromSeed = function(index) {
    if (seed.length !== 32) throw new Error("Seed should be set first.");

    let index_bytes = functions.hex_uint8(functions.dec2hex(index, 4));

    let context = blake.blake2bInit(32);
    blake.blake2bUpdate(context, seed);
    blake.blake2bUpdate(context, index_bytes);

    let secretKey = blake.blake2bFinal(context);
    let publicKey = nacl.sign.keyPair.fromSecretKey(secretKey).publicKey;

    return {
      type: KEY_TYPE.SEEDED,
      seedIndex: index,
      priv: secretKey,
      pub: publicKey
    };
  };

  _private.newKeyDataFromSecret = function(secretKey) {
    let publicKey = nacl.sign.keyPair.fromSecretKey(secretKey).publicKey;
    return {
      type: KEY_TYPE.EXPLICIT,
      priv: secretKey,
      pub: publicKey
    };
  };

  /**
   * Derives a new secret key from the seed and adds it to the wallet
   *
   * @throws An exception if theres no seed
   * @returns {string} The freshly added account address
   */
  api.newKeyFromSeed = function() {
    let index = lastKeyFromSeed + 1;

    let key = _private.newKeyDataFromSeed(index);
    key = _private.addKey(key);
    logger.log("New seeded key added to wallet.");

    lastKeyFromSeed = index;
    return key.account;
  };

  /**
   * Adds a key to the wallet
   *
   * @param {string} hex - The secret key hex encoded
   * @throws An exception on invalid secret key length
   * @throws An exception on invalid hex format
   * @returns {string} The freshly added account address
   */
  api.addSecretKey = function(hex) {
    if (hex.length !== 64)
      throw new Error("Invalid Secret Key length. Should be 32 bytes.");

    if (!/[0-9A-F]{64}/i.test(hex)) throw new Error("Invalid Hex Secret Key.");

    let key = _private.newKeyDataFromSecret(functions.hex_uint8(hex));
    key = _private.addKey(key);
    logger.log("New explicit key added to wallet.");

    return key.account;
  };

  /**
   *
   * @param {boolean} hex - To return the result hex encoded
   * @returns {string} The public key hex encoded
   * @returns {Array} The public key in a byte array
   */
  api.getPublicKey = function(hex = false) {
    if (hex) return functions.uint8_hex(current.pub);
    return current.pub;
  };

  /**
   * List all the accounts in the wallet
   *
   * @returns {Array}
   */
  api.getAccounts = function() {
    var accounts = [];
    for (var i in keys) {
      accounts.push({
        type: keys[i].type,
        account: keys[i].account,
        balance: bigInt(keys[i].balance),
        pendingBalance: bigInt(keys[i].pendingBalance),
        label: keys[i].label,
        lastHash:
          keys[i].chain.length > 0
            ? keys[i].chain[keys[i].chain.length - 1]
            : false
      });
    }
    return accounts;
  };

  /**
   * Switches the account being used by the wallet
   *
   * @param {string} accountToUse
   * @throws An exception if the account is not found in the wallet
   */
  api.useAccount = function(accountToUse) {
    for (var i in keys) {
      if (keys[i].account === accountToUse) {
        currentIdx = i;
        current = keys[i];
        return;
      }
    }
    throw new Error(
      "Account not found in wallet (" +
        accountToUse +
        ") " +
        JSON.stringify(api.getAccounts())
    );
  };

  api.importChain = function(blocks, acc) {
    api.useAccount(acc);
    var last =
      current.chain.length > 0
        ? current.chain[current.chain.length - 1].getHash(true)
        : functions.uint8_hex(current.pub);
    // verify chain
    for (let i in blocks) {
      if (blocks[i].getPrevious() !== last) throw new Error("Invalid chain");
      if (!api.verifyBlock(blocks[i]))
        throw new Error("There is an invalid block");
    }
  };

  api.getLastNBlocks = function(acc, n, offset = 0) {
    var temp = keys[currentIdx].account;
    api.useAccount(acc);
    var blocks = [];

    if (n > current.chain.length) n = current.chain.length;

    for (
      let i = current.chain.length - 1 - offset;
      i > current.chain.length - 1 - n - offset;
      i--
    ) {
      blocks.push(current.chain[i]);
    }
    api.useAccount(temp);
    return blocks;
  };

  api.getBlocksUpTo = function(acc, hash) {
    // var temp = keys[currentIdx].account;
    api.useAccount(acc);

    var blocks = [];
    for (let i = current.chain.length - 1; i > 0; i--) {
      blocks.push(current.chain[i]);
      if (current.chain[i].getHash(true) === hash) break;
    }
    return blocks;
  };

  api.getAccountBlockCount = function(acc) {
    var temp = keys[currentIdx].account;
    api.useAccount(acc);

    var n = current.chain.length;
    api.useAccount(temp);
    return n;
  };

  /**
   * Generates a block signature from the block hash using the secret key
   *
   * @param {string} blockHash - The block hash hex encoded
   * @throws An exception on invalid block hash length
   * @throws An exception on invalid block hash hex encoding
   * @returns {string} The 64 byte hex encoded signature
   */
  api.signBlock = function(block) {
    var blockHash = block.getHash();

    if (blockHash.length !== 32)
      throw new Error("Invalid block hash length. It should be 32 bytes.");

    block.setSignature(functions.uint8_hex(api.sign(blockHash)));
    block.setAccount(keys[currentIdx].account);

    logger.log("Block " + block.getHash(true) + " signed.");
  };

  /**
   * Verifies a block signature given its hash, sig and XRB account
   *
   * @param {string} blockHash - 32 byte hex encoded block hash
   * @param {string} blockSignature - 64 byte hex encoded signature
   * @param {string} account - A XRB account supposed to have signed the block
   * @returns {boolean}
   */
  api.verifyBlockSignature = function(blockHash, blockSignature, account) {
    var pubKey = functions.hex_uint8(functions.keyFromAccount(account));

    return nacl.sign.detached.verify(
      functions.hex_uint8(blockHash),
      functions.hex_uint8(blockSignature),
      pubKey
    );
  };

  api.verifyBlock = function(block, acc = "") {
    // var account = block.getAccount() ? block.getAccount() : acc;
    return api.verifyBlockSignature(
      block.getHash(true),
      block.getSignature(),
      block.getAccount()
    );
  };

  /**
   * Returns current account balance
   *
   * @returns {number} balance
   */
  api.getBalance = function() {
    return current.balance;
  };

  /**
   * Returns current account pending balance (not pocketed)
   *
   * @returns {number} pendingBalance
   */
  api.getPendingBalance = function() {
    //return current.pendingBalance
    const pendingBlocks = current.pendingBlocks;
    var am = bigInt(0);
    for (let i in pendingBlocks) {
      if (
        pendingBlocks[i].getType() === "open" ||
        pendingBlocks[i].getType() === "receive"
      )
        am = am.add(pendingBlocks[i].getAmount());
    }
    return am;
  };

  api.getRepresentative = function(acc = false) {
    if (!acc) return current.representative;
    api.useAccount(acc);
    return current.representative;
  };

  _private.setRepresentative = function(repr) {
    current.representative = repr;
  };

  /**
   * Updates current account balance
   *
   * @param {number} newBalance - The new balance in rai units
   */
  _private.setBalance = function(newBalance) {
    current.balance = bigInt(newBalance);
  };

  _private.setPendingBalance = function(newBalance) {
    current.pendingBalance = bigInt(newBalance);
  };

  api.getAccountBalance = function(acc) {
    api.useAccount(acc);
    return api.getBalanceUpToBlock(0);
  };

  api.getWalletPendingBalance = function() {
    var pending = bigInt(0);
    for (let i in walletPendingBlocks) {
      if (
        walletPendingBlocks[i].getType() === "open" ||
        walletPendingBlocks[i].getType() === "receive"
      )
        pending = pending.add(walletPendingBlocks[i].getAmount());
    }
    return pending;
  };

  api.getWalletBalance = function() {
    var bal = bigInt(0);
    var temp;
    for (let i in keys) {
      temp = keys[i].balance;
      bal = bal.add(temp);
    }
    return bal;
  };

  api.recalculateWalletBalances = function() {
    for (let i in keys) {
      api.useAccount(keys[i].account);
      _private.setBalance(api.getBalanceUpToBlock(0));
    }
  };

  api.getBalanceUpToBlock = function(blockHash) {
    if (current.chain.length <= 0) return 0;

    var sum = bigInt(0);
    var found = blockHash === 0 ? true : false;
    var blk;

    // check pending blocks first
    for (let i = current.pendingBlocks.length - 1; i >= 0; i--) {
      blk = current.pendingBlocks[i];

      if (blk.getHash(true) === blockHash) found = true;

      if (found) {
        if (blk.getType() === "open" || blk.getType() === "receive") {
          sum = sum.add(blk.getAmount());
        } else if (blk.getType() === "send") {
          sum = sum.add(blk.getBalance());
          return sum;
        }
      }
    }

    for (let i = current.chain.length - 1; i >= 0; i--) {
      blk = current.chain[i];

      if (blk.getHash(true) === blockHash) found = true;

      if (found) {
        if (blk.getType() === "open" || blk.getType() === "receive") {
          sum = sum.add(blk.getAmount());
        } else if (blk.getType() === "send") {
          sum = sum.add(blk.getBalance());
          return sum;
        }
      }
    }
    return sum;
  };

  /**
   * Updates an account balance
   *
   * @param {number} - The new balance in raw units
   * @param {string} Account - The account whose balance is being updated
   */
  _private.setAccountBalance = function(newBalance, acc) {
    var temp = currentIdx;
    api.useAccount(acc);
    _private.setBalance(newBalance);
    api.useAccount(keys[temp].account);
  };

  api.setAccountBalancePublic = function(newBalance, acc) {
    if (!lightWallet) throw new Error("Not allowed");
    _private.setAccountBalance(newBalance, acc);
  };

  _private.sumAccountPending = function(acc, amount) {
    var temp = currentIdx;
    api.useAccount(acc);
    _private.setPendingBalance(api.getPendingBalance().sum(amount));
    api.useAccount(keys[temp].account);
  };

  api.setLabel = function(acc, label) {
    for (let i in keys) {
      if (keys[i].account === acc) {
        keys[i].label = label;
        return true;
      }
    }
    return false;
  };

  api.removePendingBlocks = function() {
    current.pendingBlocks = [];
  };

  api.removePendingBlock = function(blockHash) {
    var found = false;
    for (let i in current.pendingBlocks) {
      let tmp = current.pendingBlocks[i];
      if (tmp.getHash(true) === blockHash) {
        current.pendingBlocks.splice(i, 1);
        found = true;
      }
    }
    if (!found) {
      console.log("Not found");
      return;
    }
    for (let i in walletPendingBlocks) {
      let tmp = walletPendingBlocks[i];
      if (tmp.getHash(true) === blockHash) {
        walletPendingBlocks.splice(i, 1);
        return;
      }
    }
  };

  api.getBlockFromHash = function(blockHash, acc = 0) {
    // var found = false;
    // var i = 0;
    if (acc !== 0) api.useAccount(acc);
    else api.useAccount(keys[0].account);

    for (let i = 0; i < keys.length; i++) {
      api.useAccount(keys[i].account);
      for (let j = current.chain.length - 1; j >= 0; j--) {
        var blk = current.chain[j];
        if (blk.getHash(true) === blockHash) return blk;
      }
      if (i === keys.length - 1) break;
      api.useAccount(keys[i + 1].account);
    }
    return false;
  };

  api.addBlockToReadyBlocks = function(blk) {
    readyBlocks.push(blk);
    logger.log("Block ready to be broadcasted: " + blk.getHash(true));
  };

  api.addPendingSendBlock = function(from, to, amount = 0) {
    api.useAccount(from);
    amount = bigInt(amount);

    var bal = api.getBalanceUpToBlock(0);
    var remaining = bal.minus(amount);
    var blk = new Block();

    blk.setSendParameters(current.lastPendingBlock, to, remaining);
    blk.build();
    api.signBlock(blk);
    blk.setAmount(amount);
    blk.setAccount(from);

    current.lastPendingBlock = blk.getHash(true);
    _private.setBalance(remaining);
    current.pendingBlocks.push(blk);
    walletPendingBlocks.push(blk);

    // check if we have received work already
    var worked = false;
    for (let i in remoteWork) {
      if (remoteWork[i].hash === blk.getPrevious()) {
        if (remoteWork[i].worked) {
          worked = api.updateWorkPool(blk.getPrevious(), remoteWork[i].work);
          break;
        }
      }
    }
    if (!worked) api.workPoolAdd(blk.getPrevious(), from, true);
    api.workPoolAdd(blk.getHash(true), from);

    logger.log("New send block waiting for work: " + blk.getHash(true));

    return blk;
  };

  api.addPendingReceiveBlock = function(
    sourceBlockHash,
    acc,
    from,
    amount = 0
  ) {
    amount = bigInt(amount);
    api.useAccount(acc);
    if (amount.lesser(minimumReceive)) {
      logger.log(
        "Receive block rejected due to minimum receive amount (" +
          sourceBlockHash +
          ")"
      );
      return false;
    }

    // make sure this source has not been redeemed yet
    for (let i in walletPendingBlocks) {
      if (walletPendingBlocks[i].getSource() === sourceBlockHash) return false;
    }

    for (let i in readyBlocks) {
      if (readyBlocks[i].getSource() === sourceBlockHash) return false;
    }

    for (let i in current.chain) {
      if (current.chain[i].getSource() === sourceBlockHash) return false;
    }

    var blk = new Block();
    if (current.lastPendingBlock.length === 64)
      blk.setReceiveParameters(current.lastPendingBlock, sourceBlockHash);
    else
      blk.setOpenParameters(
        sourceBlockHash,
        acc,
        raiwalletdotcomRepresentative
      );

    blk.build();
    api.signBlock(blk);
    blk.setAmount(amount);
    blk.setAccount(acc);
    blk.setOrigin(from);

    current.lastPendingBlock = blk.getHash(true);
    current.pendingBlocks.push(blk);
    walletPendingBlocks.push(blk);
    _private.setPendingBalance(api.getPendingBalance().add(amount));

    // check if we have received work already
    var worked = false;
    for (let i in remoteWork) {
      if (remoteWork[i].hash === blk.getPrevious()) {
        if (remoteWork[i].worked) {
          worked = api.updateWorkPool(blk.getPrevious(), remoteWork[i].work);
          break;
        }
      }
    }
    if (!worked) api.workPoolAdd(blk.getPrevious(), acc, true);
    api.workPoolAdd(blk.getHash(true), acc);

    logger.log("New receive block waiting for work: " + blk.getHash(true));

    return blk;
  };

  api.addPendingChangeBlock = function(acc, repr) {
    api.useAccount(acc);

    if (!current.lastPendingBlock)
      throw new Error("There needs to be at least 1 block in the chain.");

    var blk = new Block();
    blk.setChangeParameters(current.lastPendingBlock, repr);
    blk.build();
    api.signBlock(blk);
    blk.setAccount(acc);

    current.lastPendingBlock = blk.getHash(true);
    current.pendingBlocks.push(blk);
    walletPendingBlocks.push(blk);

    // check if we have received work already
    var worked = false;
    for (let i in remoteWork) {
      if (remoteWork[i].hash === blk.getPrevious()) {
        if (remoteWork[i].worked) {
          worked = api.updateWorkPool(blk.getPrevious(), remoteWork[i].work);
          break;
        }
      }
    }
    if (!worked) api.workPoolAdd(blk.getPrevious(), acc, true);
    api.workPoolAdd(blk.getHash(true), acc);

    logger.log("New change block waiting for work: " + blk.getHash(true));

    return blk;
  };

  api.getPendingBlocks = function() {
    return current.pendingBlocks;
  };

  api.getPendingBlockByHash = function(blockHash) {
    for (let i in walletPendingBlocks) {
      if (walletPendingBlocks[i].getHash(true) === blockHash)
        return walletPendingBlocks[i];
    }
    return false;
  };

  api.getNextWorkBlockHash = function(acc) {
    var prevAcc = current.account;
    api.useAccount(acc);

    let hash;
    if (current.lastBlock.length > 0) {
      hash = current.lastBlock;
    } else {
      hash = functions.uint8_hex(current.pub);
    }

    api.useAccount(prevAcc);
    return hash;
  };

  _private.setLastBlockHash = function(blockHash) {
    current.lastBlock = blockHash;
  };

  api.workPoolAdd = function(hash, acc, needed = false, work = false) {
    for (let i in remoteWork) if (remoteWork[i].hash === hash) return;

    if (work !== false) {
      remoteWork.push({
        hash: hash,
        worked: true,
        work: work,
        requested: true,
        needed: needed,
        account: acc
      });
    } else {
      remoteWork.push({
        hash: hash,
        work: "",
        worked: false,
        requested: false,
        needed: needed,
        account: acc
      });
      logger.log("New work target: " + hash);
    }
  };

  api.getWorkPool = function() {
    return remoteWork;
  };

  api.setWorkRequested = function(hash) {
    for (let i in remoteWork) {
      if (remoteWork[i].hash === hash) {
        remoteWork[i].requested = true;
        break;
      }
    }
  };

  api.setWorkNeeded = function(hash) {
    for (let i in remoteWork) {
      if (remoteWork[i].hash === hash) {
        remoteWork[i].needed = true;
        break;
      }
    }
  };

  api.checkWork = function(hash, work) {
    var t = functions.hex_uint8(MAIN_NET_WORK_THRESHOLD);
    var context = blake.blake2bInit(8, null);
    blake.blake2bUpdate(context, functions.hex_uint8(work).reverse());
    blake.blake2bUpdate(context, functions.hex_uint8(hash));
    var threshold = blake.blake2bFinal(context).reverse();

    if (threshold[0] === t[0])
      if (threshold[1] === t[1])
        if (threshold[2] === t[2]) if (threshold[3] >= t[3]) return true;
    return false;
  };

  api.updateWorkPool = function(hash, work) {
    var found = false;
    if (!api.checkWork(work, hash)) {
      logger.warn("Invalid PoW received (" + work + ") (" + hash + ").");
      return false;
    }

    for (let i in remoteWork) {
      if (remoteWork[i].hash === hash) {
        remoteWork[i].work = work;
        remoteWork[i].worked = true;
        remoteWork[i].requested = true;
        remoteWork[i].needed = false;

        found = true;
        for (let j in walletPendingBlocks) {
          if (walletPendingBlocks[j].getPrevious() === hash) {
            logger.log(
              "Work received for block " +
                walletPendingBlocks[j].getHash(true) +
                " previous: " +
                hash
            );
            var aux = walletPendingBlocks[j];
            aux.setWork(work);
            try {
              api.confirmBlock(aux.getHash(true));
              remoteWork.splice(i, 1);
              api.setWorkNeeded(aux.getHash(true));
              return true;
            } catch (e) {
              logger.error(
                "Error adding block " +
                  aux.getHash(true) +
                  " to chain: " +
                  e.message
              );
              errorBlocks.push(aux);
            }
            break;
          }
        }
        break;
      }
    }

    if (!found) {
      logger.warn("Work received for missing target: " + hash);
      // add to work pool just in case, it may be a cached from the last block
      api.workPoolAdd(hash, "", false, work);
    }
    return false;
  };

  api.checkWork = function(work, blockHash) {
    var t = functions.hex_uint8(MAIN_NET_WORK_THRESHOLD);
    var context = blake.blake2bInit(8, null);
    blake.blake2bUpdate(context, functions.hex_uint8(work).reverse());
    blake.blake2bUpdate(context, functions.hex_uint8(blockHash));
    var threshold = blake.blake2bFinal(context).reverse();

    if (threshold[0] === t[0])
      if (threshold[1] === t[1])
        if (threshold[2] === t[2]) if (threshold[3] >= t[3]) return true;
    return false;
  };

  api.waitingRemoteWork = function() {
    for (var i in remoteWork) {
      if (!remoteWork[i].worked) return true;
    }
    return false;
  };

  api.getReadyBlocks = function() {
    return readyBlocks;
  };

  api.getNextReadyBlock = function() {
    if (readyBlocks.length > 0) return readyBlocks[0];
    else return false;
  };

  api.getReadyBlockByHash = function(blockHash) {
    for (let i in readyBlocks) {
      if (readyBlocks[i].getHash(true) === blockHash) {
        return readyBlocks[i];
      }
    }
    return false;
  };

  api.removeReadyBlock = function(blockHash) {
    for (let i in readyBlocks) {
      if (readyBlocks[i].getHash(true) === blockHash) {
        var blk = readyBlocks[i];
        readyBlocks.splice(i, 1);
        return blk;
      }
    }
    return false;
  };

  /**
   * Adds block to account chain
   *
   * @param {string} - blockHash The block hash
   * @throws An exception if the block is not found in the ready blocks array
   * @throws An exception if the previous block does not match the last chain block
   * @throws An exception if the chain is empty and the block is not of type open
   */
  api.confirmBlock = function(blockHash, broadcast = true) {
    var blk = api.getPendingBlockByHash(blockHash);
    if (blk) {
      if (blk.ready()) {
        api.useAccount(blk.getAccount());
        if (current.chain.length === 0) {
          // open block
          if (blk.getType() !== "open" && !lightWallet)
            throw new Error("First block needs to be 'open'.");
          current.chain.push(blk);
          if (broadcast) readyBlocks.push(blk);
          api.removePendingBlock(blockHash);
          _private.setPendingBalance(
            api.getPendingBalance().minus(blk.getAmount())
          );
          _private.setBalance(api.getBalance().add(blk.getAmount()));
        } else {
          if (
            blk.getPrevious() ===
            current.chain[current.chain.length - 1].getHash(true)
          ) {
            if (blk.getType() === "receive") {
              _private.setPendingBalance(
                api.getPendingBalance().minus(blk.getAmount())
              );
              _private.setBalance(api.getBalance().add(blk.getAmount()));
            } else if (blk.getType() === "send") {
              // check if amount sent matches amount actually being sent
              var real = api.getBalanceUpToBlock(blk.getPrevious());
              if (blk.isImmutable()) {
                blk.setAmount(real.minus(blk.getBalance("dec")));
              } else if (
                real.minus(blk.getBalance("dec")).neq(blk.getAmount())
              ) {
                logger.error(
                  "Sending incorrect amount (" +
                    blk.getAmount().toString() +
                    ") (" +
                    real.minus(blk.getBalance("dec")).toString() +
                    ")"
                );
                api.recalculateWalletBalances();
                throw new Error("Incorrect send amount.");
              }
            } else if (blk.getType() === "change") {
              // TODO
              _private.setRepresentative(blk.getRepresentative());
            } else throw new Error("Invalid block type");
            current.chain.push(blk);
            if (broadcast) readyBlocks.push(blk);
            api.removePendingBlock(blockHash);
            api.recalculateWalletBalances();
          } else {
            console.log(
              blk.getPrevious() +
                " " +
                current.chain[current.chain.length - 1].getHash(true)
            );
            logger.warn("Previous block does not match actual previous block");
            throw new Error(
              "Previous block does not match actual previous block"
            );
          }
        }
        logger.log("Block added to chain: " + blk.getHash(true));
      } else {
        logger.error("Trying to confirm block without signature or work.");
        throw new Error("Block lacks signature or work.");
      }
    } else {
      logger.warn("Block trying to be confirmed has not been found.");
      throw new Error("Block not found");
    }
  };

  api.importBlock = function(blk, acc, broadcast = true) {
    api.useAccount(acc);
    blk.setAccount(acc);
    if (!blk.ready()) throw new Error("Block should be complete.");

    current.lastPendingBlock = blk.getHash(true);

    // check if there is a conflicting block pending
    for (let i in current.pendingBlocks) {
      if (current.pendingBlocks[i].getPrevious() === blk.getPrevious()) {
        // conflict
        _private.fixPreviousChange(blk.getPrevious(), blk.getHash(true), acc);
      }
    }

    current.pendingBlocks.push(blk);
    walletPendingBlocks.push(blk);
    api.confirmBlock(blk.getHash(true), broadcast);
  };

  api.importForkedBlock = function(blk, acc) {
    api.useAccount(acc);
    var prev = blk.getPrevious();

    for (let i = current.chain.length - 1; i >= 0; i--) {
      if (current.chain[i].getPrevious() === prev) {
        // fork found, delete block and its successors
        current.chain.splice(i, current.chain.length);

        // delete pending blocks if any
        current.pendingBlocks = [];

        // import new block
        api.importBlock(blk, acc);
        return true;
      }
    }
    return false;
  };

  _private.fixPreviousChange = function(oldPrevious, newPrevious, acc) {
    api.useAccount(acc);
    for (let i in current.pendingBlocks) {
      if (current.pendingBlocks[i].getPrevious() === oldPrevious) {
        var oldHash = current.pendingBlocks[i].getHash(true);
        current.pendingBlocks[i].changePrevious(newPrevious);
        var newHash = current.pendingBlocks[i].getHash(true);
        current.lastPendingBlock = newHash;
        _private.fixPreviousChange(oldHash, newHash, acc);
      }
    }
  };

  api.getLoginKey = function() {
    return loginKey;
  };

  api.setLoginKey = function(lk = false) {
    if (loginKey === false)
      if (lk) loginKey = lk;
      else loginKey = functions.uint8_hex(nacl.randomBytes(32));
    // cannot be changed
  };

  api.lightWallet = function(light) {
    lightWallet = light;
  };

  /**
   * Encrypts an packs the wallet data in a hex string
   *
   * @returns {string}
   */
  api.pack = function() {
    var pack = {};

    pack.seed = functions.uint8_hex(seed);
    pack.last = lastKeyFromSeed;
    pack.version = version;
    pack.loginKey = loginKey;
    pack.minimumReceive = minimumReceive.toString();

    pack.accounts = [];
    for (var i in keys) {
      let key = keys[i];
      switch (key.type) {
        case KEY_TYPE.SEEDED:
          pack.accounts.push({
            type: KEY_TYPE.SEEDED,
            label: key.label,
            seedIndex: key.seedIndex
          });
          break;
        case KEY_TYPE.EXPLICIT:
          pack.accounts.push({
            type: KEY_TYPE.EXPLICIT,
            label: key.label,
            secretKey: functions.uint8_hex(key.priv)
          });
          break;
        default:
          throw new Error("Unsupported key type");
      }
    }

    pack = JSON.stringify(pack);
    pack = functions.stringToHex(pack);
    pack = new Buffer(pack, "hex");

    var context = blake.blake2bInit(32);
    blake.blake2bUpdate(context, pack);
    var checksum = blake.blake2bFinal(context);

    var salt = new Buffer(nacl.randomBytes(16));
    var key = pbkdf2.pbkdf2Sync(passPhrase, salt, iterations, 32, "sha1");

    var options = { mode: AES.CBC, padding: Iso10126 };
    var encryptedBytes = AES.encrypt(pack, key, salt, options);

    var payload = Buffer.concat([new Buffer(checksum), salt, encryptedBytes]);

    // decrypt to check if wallet was corrupted during ecryption somehow
    if (api.decryptAndCheck(payload).toString("hex") === false)
      return api.pack(); // try again, shouldnt happen often
    return payload.toString("hex");
  };

  /**
   * Constructs the wallet from an encrypted base64 encoded wallet
   *
   */
  api.load = function(data) {
    var decryptedBytes = api.decryptAndCheck(data);
    if (decryptedBytes === false)
      throw new Error("Wallet is corruped or has been tampered.");

    var walletData = JSON.parse(decryptedBytes.toString("utf8"));

    if (!walletData.version || walletData.version === 1) {
      // Migrate data to v2 format
      let labels = walletData.labels || [];
      walletData.accounts = [];
      for (let i = 0; i < (walletData.last || 0) + 1; i++) {
        let label = "";
        for (let j in labels) {
          if (labels[j].key === i) {
            label = labels[j].label;
            break;
          }
        }
        walletData.accounts.push({
          type: KEY_TYPE.SEEDED,
          label: label,
          seedIndex: i
        });
      }
      delete walletData.labels;
      delete walletData.last;
    }

    seed = functions.hex_uint8(walletData.seed);
    minimumReceive =
      walletData.minimumReceive !== undefined
        ? bigInt(walletData.minimumReceive)
        : bigInt("1000000000000000000000000");
    loginKey = walletData.loginKey !== undefined ? walletData.loginKey : false;

    for (let i in walletData.accounts || []) {
      let acc = walletData.accounts[i];
      switch (acc.type) {
        case KEY_TYPE.SEEDED: {
          let key = _private.newKeyDataFromSeed(acc.seedIndex);
          key.label = acc.label;
          _private.addKey(key);
          lastKeyFromSeed = Math.max(lastKeyFromSeed, acc.seedIndex);
          break;
        }
        case KEY_TYPE.EXPLICIT: {
          let key = _private.newKeyDataFromSecret(
            functions.hex_uint8(acc.secretKey)
          );
          key.label = acc.label;
          _private.addKey(key);
          break;
        }
        default:
          throw new Error("Unsupported key type");
      }
    }

    lastKeyFromSeed = Math.max(walletData.last || 0, lastKeyFromSeed);

    api.useAccount(keys[0].account);

    ciphered = false;
    return walletData;
  };

  api.decryptAndCheck = function(data) {
    var bytes = new Buffer(data, "hex");
    var checksum = bytes.slice(0, 32);
    var salt = bytes.slice(32, 48);
    var payload = bytes.slice(48);
    var key = pbkdf2.pbkdf2Sync(passPhrase, salt, iterations, 32, "sha1");

    var options = {};
    options.padding = options.padding || Iso10126;
    var decryptedBytes = AES.decrypt(payload, key, salt, options);

    var context = blake.blake2bInit(32);
    blake.blake2bUpdate(context, decryptedBytes);
    var hash = functions.uint8_hex(blake.blake2bFinal(context));

    if (hash !== checksum.toString("hex").toUpperCase()) return false;
    return decryptedBytes;
  };

  api.createWallet = function(setSeed = false) {
    if (!setSeed) seed = nacl.randomBytes(32);
    else api.setSeed(setSeed);
    api.newKeyFromSeed();
    api.useAccount(keys[0].account);
    loginKey = functions.uint8_hex(nacl.randomBytes(32));
    return functions.uint8_hex(seed);
  };

  // Encrypt using aes-256-cbc
  api.encrypt = function encrypt(text, password) {
    var cipher = crypto.createCipher("aes-256-cbc", password);
    var crypted = cipher.update(text, "utf8", "hex");
    crypted += cipher.final("hex");
    return crypted;
  };

  // Decrypt using aes-256-cbc
  api.decrypt = function decrypt(text, password) {
    var decipher = crypto.createDecipher("aes-256-cbc", password);
    var dec = decipher.update(text, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  };

  api.newBlock = function(block, account) {
    var blk = new Block();
    blk.buildFromJSON(block);
    blk.setAccount(account);
    blk.setAmount(block.amount);
    blk.setImmutable(true);
    return blk;
  };

  api.clientPoW = function(callback) {
    console.log("clientPoW called");
    var pool = api.getWorkPool();
    var hash = false;
    if (pool.length > 0) {
      for (var i in pool) {
        if (pool[i].needed || !pool[i].requested) {
          hash = pool[i].hash;
          break;
        }
      }

      if (hash === false) {
        return window.setTimeout(api.clientPoW, 200);
      }

      pow.run(hash, NaN, function(result) {
        console.log("PoW found for " + hash + ": " + result);
        api.updateWorkPool(hash, result);
        window.setTimeout(api.clientPoW, 200);
        callback();
      });
    } else {
      window.setTimeout(api.clientPoW, 200);
    }
  };

  return api;
}
