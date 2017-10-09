const cjktab = {};
const cjkjmp = { 0x4dc0: 0x4e00, 0xa000: 0xac00, 0xd800: 0xe000 };
let cjk = 0x3400;
const [prestr, compdict] = require('./emoji_compressed');

const dict = [compdict[0]];
compdict.slice(1).split('').forEach(c => {
  if (c === ',') {
    dict.push('');
    return;
  }
  const lc = c.toLowerCase();
  if (lc != c && c === c.toUpperCase()) {
    dict.push(lc);
    return;
  }
  dict[dict.length - 1] += c;
});

dict.forEach(tok => {
  cjktab[String.fromCharCode(cjk++)] = tok.replace(/[\\"]/g, c => ({ '\\': '\\\\', '"': '\\"' })[c]);
  if (cjk in cjkjmp) cjk = cjkjmp[cjk];
});

const str = prestr.replace(
  /[\x0e-\x12]/g,
  c => ([':[[["', ',[],', '"],["', '"]],["', ']],'])[c.charCodeAt(0) - 0xe]
).replace(
  /\x05/g,
  '\u200d'
).replace(
  /[\u0100-\u0fff]/g,
  c => String.fromCodePoint(c.charCodeAt(0) + 0x1f000)
).replace(
  /[\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7ff\ue000-\ufaff]+/g,
  m => `"${Array.from(m, c => cjktab[c]).join(',')}"`
).replace(
  /"([\x01-\x04])([^"]*)"/g,
  (all, pfxc, uni) => {
    const pfx = pfxc.charCodeAt(0) - 1;
    const lower = !!(pfx & 2);
    const padding = !!(pfx & 1);
    return `"${uni.match(/./ug).map(c => {
      let hex = c.codePointAt(0).toString(16);
      if (hex.length < 4 && padding) {
        hex = '0'.repeat(4 - hex.length);
      }
      return lower ? hex.toLowerCase() : hex.toUpperCase();
    }).join('-')}"`;
  }
);

module.exports = eval(`(d => d)(${str})`);
