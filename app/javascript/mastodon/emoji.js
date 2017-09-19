import { unicodeMapping } from './emojione_light';
import Trie from 'substring-trie';
import sprites from '../images/emojione-sprites-path';
import highlight from './v6don/highlighter';

const trie = new Trie(Object.keys(unicodeMapping));

const emojify = (str, customEmojis = {}) => {
  let rtn = '';
  for (;;) {
    let match, i = 0, tag;
    while (i < str.length && (tag = '<&:'.indexOf(str[i])) === -1 && !(match = trie.search(str.slice(i)))) {
      i += str.codePointAt(i) < 65536 ? 1 : 2;
    }
    if (i === str.length)
      break;
    else if (tag >= 0) {
      let tagend = str.indexOf('>;:'[tag], i + 1) + 1;
      if (!tagend)
        break;
      if (str[i] === ':') {
        const shortname = str.slice(i, tagend);
        const lt = str.indexOf('<', i + 1);
        if ((lt === -1 || lt >= tagend) && shortname in customEmojis) {
          rtn += str.slice(0, i) + `<img draggable="false" class="emojione" alt="${shortname}" title="${shortname}" src="${customEmojis[shortname]}" />`;
          str = str.slice(tagend);
        } else {
          rtn += str.slice(0, i + 1);
          str = str.slice(i + 1);
        }
      } else {
        rtn += str.slice(0, tagend);
        str = str.slice(tagend);
      }
    } else {
      const [codeSeq, shortCode] = unicodeMapping[match];
      rtn += str.slice(0, i) + `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="emojione" viewBox="0 0 1 1"><g><title>:${shortCode}:</title><desc>${match}</desc><use xlink:href="${sprites}#emoji-${codeSeq}"/></g></svg>`;
      str = str.slice(i + match.length);
    }
  }
  return rtn + str;
};

const emojify_v6don = (text, customEmojis) => emojify(highlight(text), customEmojis);

export default emojify_v6don;
