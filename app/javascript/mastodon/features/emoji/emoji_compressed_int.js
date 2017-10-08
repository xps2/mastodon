const cjktab = {};
const cjkjmp = { 0x4dc0: 0x4e00, 0xa000: 0xac00, 0xd800: 0xe000 };
let cjk = 0x3400;
const [prestr, dict] = require('./emoji_compressed');

dict.split(',').forEach(tok => {
  cjktab[String.fromCharCode(cjk++)] = tok.replace(/[\\"]/g, c => ({ '\\': '\\\\', '"': '\\"' })[c]);
  if (cjk in cjkjmp) cjk = cjkjmp[cjk];
});

const str = prestr.replace(
  /[\u0100-\u0fff]/g,
  c => String.fromCodePoint(c.charCodeAt(0) + 0x1f000)
).replace(
  /"([\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7ff\ue000-\ufaff]+)"/g,
  (all, cjkstr) => `"${Array.from(cjkstr, c => cjktab[c]).join(',')}"`
).replace(
  /([\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7ff\ue000-\ufaff]):/g,
  (all, c) => `"${cjktab[c]}":`
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
