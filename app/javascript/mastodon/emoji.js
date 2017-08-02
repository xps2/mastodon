import { unicodeMapping } from './emojione_light';
import Trie from 'substring-trie';
import highlight from './v6don-highlighter';

const excluded = ["®", "©", "™"];
const notintab = [];
excluded.forEach(c => {
  if (unicodeMapping[c] !== undefined) {
    delete unicodeMapping[c];
  }
  else {
    notintab.push(`<${c}>`);
  }
});
if (notintab.length) {
  console.warn(`Excluded character(s) for emojify() [${notintab.join(', ')}] are not defined in unicodeMapping. Please contact the webmaster to solve it.`)
}

const trie = new Trie(Object.keys(unicodeMapping));

const emojify = str => {
  let rtn = "";
  for (;;) {
    let match, c, i = 0, tag;
    while (i < str.length && ((tag = "<&".indexOf(c = str[i])) == -1 && !(match = trie.search(str.slice(i))))) {
      i += str.codePointAt(i) < 65536 ? 1 : 2;
    }
    if (i == str.length)
      break;
    else if (tag >= 0) {
      let tagend = str.indexOf(">;"[tag], i + 1) + 1;
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

const emojify_v6don = text => emojify(highlight(text));
  
export default emojify_v6don;
