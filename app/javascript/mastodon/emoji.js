import { unicodeMapping } from './emojione_light';
import Trie from 'substring-trie';
import sprites from '../images/emojione-sprites-path';
import highlight from './v6don/highlighter';

const trie = new Trie(Object.keys(unicodeMapping));

const emojify = str => {
  let rtn = '';
  for (;;) {
    let match, i = 0, tag;
    while (i < str.length && (tag = '<&'.indexOf(str[i])) === -1 && !(match = trie.search(str.slice(i)))) {
      i += str.codePointAt(i) < 65536 ? 1 : 2;
    }
    if (i === str.length)
      break;
    else if (tag >= 0) {
      let tagend = str.indexOf('>;'[tag], i + 1) + 1;
      if (!tagend)
        break;
      rtn += str.slice(0, tagend);
      str = str.slice(tagend);
    } else {
      const [codeSeq, shortCode] = unicodeMapping[match];
      rtn += str.slice(0, i) + `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
          class="emojione" viewBox="0 0 1 1"
        ><g><title>:${shortCode}:</title><desc>${match}</desc><use xlink:href="${sprites}#emoji-${codeSeq}"/></g></svg>`;
      str = str.slice(i + match.length);
    }
  }
  return rtn + str;
};

const emojify_v6don = text => emojify(highlight(text));

export default emojify_v6don;
