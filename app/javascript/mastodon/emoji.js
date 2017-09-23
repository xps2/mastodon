import { unicodeMapping } from './emojione_light';
import Trie from 'substring-trie';
import highlight from './v6don/highlighter';

const trie = new Trie(Object.keys(unicodeMapping));

const assetHost = process.env.CDN_HOST || '';

const emojify = (str, customEmojis = {}) => {
  let rtn = '';
  for (;;) {
    let match, i = 0, tag;
    while (i < str.length && (tag = '<&:'.indexOf(str[i])) === -1 && !(match = trie.search(str.slice(i)))) {
      i += str.codePointAt(i) < 65536 ? 1 : 2;
    }
    let replaceEnd, replacement = '';
    if (i === str.length) {
      break;
    } else if (str[i] === ':') {
      const testsn = () => {
        replaceEnd = str.indexOf(':', i + 1) + 1;
        if (!replaceEnd) return false; // no pair of ':'
        const lt = str.indexOf('<', i + 1);
        if (!(lt === -1 || lt >= replaceEnd)) return false; // tag appeared before closing ':'
        const shortname = str.slice(i, replaceEnd);
        // if replacing :shortname: succeed, set replacement and return true
        if (shortname in customEmojis) {
          replacement = `<img draggable="false" class="emojione" alt="${shortname}" title="${shortname}" src="${customEmojis[shortname]}" />`;
          return true;
        }
        return false;
      };
      if (!testsn()) {
        replaceEnd = ++i;
      }
    } else if (tag >= 0) {
      // <, &
      replaceEnd = str.indexOf('>;'[tag], i + 1) + 1;
      if (!replaceEnd) break;
      i = replaceEnd;
    } else {
      // matched to unicode emoji
      const [filename, shortCode] = unicodeMapping[match];
      replacement = `<img draggable="false" class="emojione" alt="${match}" title=":${shortCode}:" src="${assetHost}/emoji/${filename}.svg" />`;
      replaceEnd = i + match.length;
    }
    rtn += str.slice(0, i) + replacement;
    str = str.slice(replaceEnd);
  }
  return rtn + str;
};

const emojify_v6don = (text, customEmojis) => emojify(highlight(text, customEmojis), customEmojis);

export { emojify as emojify_original };
export default emojify_v6don;
