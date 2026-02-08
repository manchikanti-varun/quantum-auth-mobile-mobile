/**
 * TOTP (RFC 6238) implementation for React Native.
 * Self-contained HMAC-SHA1 and base32 decode; no external crypto dependencies.
 * @module services/totp
 */

function hexToBytes(hex) {
  const a = hex.replace(/^0x/i, '');
  const out = new Uint8Array(a.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(a.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function base32Decode(str) {
  const base32 = require('hi-base32');
  const clean = String(str).toUpperCase().replace(/\s/g, '').replace(/=+$/, '');
  const bytes = base32.decode.asBytes(clean);
  return new Uint8Array(bytes);
}

function sha1Bytes(msg) {
  const len = msg.length;
  const bitLen = len * 8;
  const padLen = ((((len + 9) >> 6) << 6) + 64) - len;
  const total = len + padLen;
  const buf = new Uint8Array(total);
  buf.set(msg);
  buf[len] = 0x80;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  view.setUint32(total - 4, (bitLen >>> 0) & 0xffffffff, false);
  view.setUint32(total - 8, Math.floor(bitLen / 0x100000000), false);

  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
  const W = new Uint32Array(80);

  for (let off = 0; off < total; off += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(off + t * 4, false);
    }
    for (let t = 16; t < 80; t++) {
      W[t] = ((W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16]) << 1) | ((W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16]) >>> 31);
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let t = 0; t < 80; t++) {
      let f, k;
      if (t < 20) {
        f = (b & c) | ((~b) & d);
        k = K[0];
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = K[1];
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = K[2];
      } else {
        f = b ^ c ^ d;
        k = K[3];
      }
      const rot = ((a << 5) | (a >>> 27)) >>> 0;
      const tVal = (((rot + f + e + k + W[t]) >>> 0) & 0xffffffff) >>> 0;
      e = d; d = c; c = ((b << 30) | (b >>> 2)) >>> 0; b = a; a = tVal;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }

  const out = new Uint8Array(20);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  return out;
}

function hmacSha1(key, message) {
  const blockLen = 64;
  let k = key;
  if (k.length > blockLen) {
    k = sha1Bytes(k);
  }
  const kPad = new Uint8Array(blockLen);
  kPad.set(k);
  const ipad = new Uint8Array(blockLen);
  const opad = new Uint8Array(blockLen);
  for (let i = 0; i < blockLen; i++) {
    ipad[i] = kPad[i] ^ 0x36;
    opad[i] = kPad[i] ^ 0x5c;
  }
  const inner = new Uint8Array(blockLen + message.length);
  inner.set(ipad);
  inner.set(message, blockLen);
  const innerHash = sha1Bytes(inner);
  const outer = new Uint8Array(blockLen + 20);
  outer.set(opad);
  outer.set(innerHash, blockLen);
  return sha1Bytes(outer);
}

function hotp(secret, counter) {
  const counterBytes = new Uint8Array(8);
  const view = new DataView(counterBytes.buffer);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);
  const hash = hmacSha1(secret, counterBytes);
  const offset = hash[19] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  return (binary % 1000000).toString().padStart(6, '0');
}

export function generateTOTP(secretBase32) {
  const secret = base32Decode(secretBase32);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  return hotp(secret, counter);
}

export function generateTOTPWithAdjacent(secretBase32) {
  const secret = base32Decode(secretBase32);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  return {
    current: hotp(secret, counter),
    prev: hotp(secret, counter - 1),
    next: hotp(secret, counter + 1),
  };
}

export function getTimeRemainingInWindow() {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

function verifyTotpImplementation() {
  const rfcKeyHex = '3132333435363738393031323334353637383930';
  const keyBytes = hexToBytes(rfcKeyHex);
  const got = hotp(keyBytes, 1);
  const expected = '287082';
  if (got !== expected) return false;
  return true;
}
verifyTotpImplementation();
