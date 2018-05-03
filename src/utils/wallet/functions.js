import blake from 'blakejs';
import crypto from 'crypto';

export const stringFromHex = (ihex) => {
  const hex = ihex.toString(); // force conversion
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
};

export const stringToHex = (str) => {
  let hex = '';
  for (let i = 0; i < str.length; i += 1) {
    hex += `${str.charCodeAt(i).toString(16)}`;
  }
  return hex;
};

export const dec2hex = (str, bytes = null) => {
  const dec = str.toString().split('');
  const sum = [];
  let hex = [];
  let i;
  let s;
  while (dec.length) {
    s = 1 * dec.shift();
    for (i = 0; s || i < sum.length; i += 1) {
      s += (sum[i] || 0) * 10;
      sum[i] = s % 16;
      s = (s - sum[i]) / 16;
    }
  }
  while (sum.length) {
    hex.push(sum.pop().toString(16));
  }

  hex = hex.join('');

  if (hex.length % 2 !== 0) hex = `0${hex}`;

  if (bytes > hex.length / 2) {
    const diff = bytes - (hex.length / 2);
    for (let j = 0; j < diff; j += 1) hex = `00${hex}`;
  }

  return hex;
};

function add(ix, iy) {
  let c = 0;
  const r = [];
  const x = ix.split('').map(Number);
  const y = iy.split('').map(Number);
  while (x.length || y.length) {
    const s = (x.pop() || 0) + (y.pop() || 0) + c;
    r.unshift(s < 10 ? s : s - 10);
    c = s < 10 ? 0 : 1;
  }
  if (c) r.unshift(c);
  return r.join('');
}

export const hex2dec = (s) => {
  let dec = '0';
  s.split('').forEach((chr) => {
    const n = parseInt(chr, 16);
    for (let t = 8; t; t >>= 1) {
      dec = add(dec, dec);
      if (n & t) dec = add(dec, '1');
    }
  });
  return dec;
};

/*
 BSD 3-Clause License
 Copyright (c) 2017, SergiySW
 All rights reserved.
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 * Neither the name of the copyright holder nor the names of its
 contributors may be used to endorse or promote products derived from
 this software without specific prior written permission.
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// Arrays manipulations
function uint8_uint4(uint8) {
  const length = uint8.length;
  const uint4 = new Uint8Array(length * 2);
  for (let i = 0; i < length; i += 1) {
    uint4[i * 2] = (uint8[i] / 16) | 0;
    uint4[(i * 2) + 1] = uint8[i] % 16;
  }
  return uint4;
}

function uint4_uint8(uint4) {
  const length = uint4.length / 2;
  const uint8 = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    uint8[i] = (uint4[i * 2] * 16) + uint4[(i * 2) + 1];
  }
  return uint8;
}

function uint4_uint5(uint4) {
  const length = (uint4.length / 5) * 4;
  const uint5 = new Uint8Array(length);
  for (let i = 1; i <= length; i += 1) {
    const n = i - 1;
    const m = i % 4;
    const z = n + ((i - m) / 4);
    const right = uint4[z] << m;
    let left;
    if ((length - i) % 4 === 0) left = uint4[z - 1] << 4;
    else left = uint4[z + 1] >> (4 - m);
    uint5[n] = (left + right) % 32;
  }
  return uint5;
}

function uint5_uint4(uint5) {
  const length = (uint5.length / 4) * 5;
  const uint4 = new Uint8Array(length);
  for (let i = 1; i <= length; i += 1) {
    const n = i - 1;
    const m = i % 5;
    const z = n - ((i - m) / 5);
    const right = uint5[z - 1] << (5 - m);
    const left = uint5[z] >> m;
    uint4[n] = (left + right) % 16;
  }
  return uint4;
}

function string_uint5(string) {
  const letter_list = '13456789abcdefghijkmnopqrstuwxyz'.split('');
  const length = string.length;
  const string_array = string.split('');
  const uint5 = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) { uint5[i] = letter_list.indexOf(string_array[i]); }
  return uint5;
}

function uint5_string(uint5) {
  const letter_list = '13456789abcdefghijkmnopqrstuwxyz'.split('');
  let string = '';
  for (let i = 0; i < uint5.length; i += 1) string += letter_list[uint5[i]];
  return string;
}

export const hex_uint8 = (hex) => {
  const length = (hex.length / 2) | 0;
  const uint8 = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) { uint8[i] = parseInt(hex.substr(i * 2, 2), 16); }
  return uint8;
};

function hex_uint4(hex) {
  const length = hex.length;
  const uint4 = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) uint4[i] = parseInt(hex.substr(i, 1), 16);
  return uint4;
}

export const uint8_hex = (uint8) => {
  let hex = '';
  let aux;
  for (let i = 0; i < uint8.length; i += 1) {
    aux = uint8[i].toString(16).toUpperCase();
    if (aux.length === 1) aux = `0${aux}`;
    hex += aux;
    aux = '';
  }
  return hex;
};

export const uint4_hex = (uint4) => {
  let hex = '';
  for (let i = 0; i < uint4.length; i += 1) { hex += uint4[i].toString(16).toUpperCase(); }
  return hex;
};

function equal_arrays(array1, array2) {
  for (let i = 0; i < array1.length; i += 1) {
    if (array1[i] !== array2[i]) return false;
  }
  return true;
}

function array_crop(array) {
  const length = array.length - 1;
  const cropped_array = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) cropped_array[i] = array[i + 1];
  return cropped_array;
}

export const keyFromAccount = (account) => {
  if (
    (account.startsWith('bus_1') || account.startsWith('bus_3')) &&
    account.length === 64
  ) {
    const account_crop = account.substring(4, 64);
    const isValid = /^[13456789abcdefghijkmnopqrstuwxyz]+$/.test(account_crop);
    if (isValid) {
      const key_uint4 = array_crop(uint5_uint4(string_uint5(account_crop.substring(0, 52))));
      const hash_uint4 = uint5_uint4(string_uint5(account_crop.substring(52, 60)));
      const key_array = uint4_uint8(key_uint4);
      const blake_hash = blake.blake2b(key_array, null, 5).reverse();
      if (equal_arrays(hash_uint4, uint8_uint4(blake_hash))) {
        const key = uint4_hex(key_uint4);
        return key;
      } throw new Error('Checksum incorrect.');
    } else throw new Error('Invalid BUS account.');
  }
  throw new Error('Invalid BUS account.');
};

export const accountFromHexKey = (hex) => {
  let checksum = '';
  const key_bytes = uint4_uint8(hex_uint4(hex));
  checksum = uint5_string(uint4_uint5(uint8_uint4(blake.blake2b(key_bytes, null, 5).reverse())));
  const c_account = uint5_string(uint4_uint5(hex_uint4(`0${hex}`)));
  return `bus_${c_account}${checksum}`;
};

export const parseBUSAccount = (str) => {
  const i = str.indexOf('bus_');
  if (i !== -1) {
    const acc = str.slice(i, i + 64);
    try {
      keyFromAccount(acc);
      return acc;
    } catch (e) {
      return false;
    }
  }
  return false;
};

// aes-256-cbc encrypt
export const encrypt = (message, key) => {
  const algorithm = 'aes-256-cbc';
  const cipher = crypto.createCipher(algorithm, key);
  const crypted = cipher.update(message, 'utf8', 'hex');
  return `${crypted}${cipher.final('hex')}`;
};

// aes-256-cbc decrypt
export const decrypt = (message, key) => {
  const algorithm = 'aes-256-cbc';
  const decipher = crypto.createDecipher(algorithm, key);
  const dec = decipher.update(message, 'hex', 'utf8');
  return `${dec}${decipher.final('utf8')}`;
};
