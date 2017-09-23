// @preval
// Force tree shaking on emojione by exposing just a subset of its functionality

const emojione = require('emojione');

const mappedUnicode = emojione.mapUnicodeToShort();
const excluded = ['®', '©', '™'];

const keys = Object.keys(emojione.jsEscapeMap);
excluded.forEach(c => {
  let idx = keys.findIndex(k => k === c);
  if (idx !== -1) {
    keys.splice(idx, 1);
  }
});
module.exports.unicodeMapping = keys
  .map(unicodeStr => [unicodeStr, mappedUnicode[emojione.jsEscapeMap[unicodeStr]]])
  .map(([unicodeStr, shortCode]) => ({ [unicodeStr]: [emojione.emojioneList[shortCode].fname.replace(/^0+/g, ''), shortCode.slice(1, shortCode.length - 1)] }))
  .reduce((x, y) => Object.assign(x, y), { });
