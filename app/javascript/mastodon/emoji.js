import { unicodeMapping } from './emojione_light';
import Trie from 'substring-trie';
import toV6donEmoji from './emoji-v6don';

const trie = new Trie(Object.keys(unicodeMapping));

const emojify = str => {
  let rtn = "";
  for (;;) {
    let match, c, i = 0;
    while (i < str.length && (c = str[i]) != '<' && c != '&' && !(match = trie.search(str.slice(i)))) {
      i += str.codePointAt(i) < 65536 ? 1 : 2;
    }
    if (i == str.length)
      break;
    else if (c == '<' || c == '&') {
      let tagend = str.indexOf(">;"["<&".indexOf(c)], i + 1) + 1;
      if (!tagend)
        break;
      rtn += str.slice(0, tagend);
      str = str.slice(tagend);
      continue;
    }
    const [filename, shortCode] = unicodeMapping[match];
    rtn += str.slice(0, i) + `<img draggable="false" class="emojione" alt="${match}" title=":${shortCode}:" src="/emoji/${filename}.svg" />`;
    str = str.slice(i + match.length);
  }
  return rtn + str;
}

const emojify_v6don = text =>
  toV6donEmoji("post", emojify(toV6donEmoji("pre", text)));
  
export default emojify_v6don;
