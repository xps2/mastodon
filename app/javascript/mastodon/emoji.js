import { unicodeMapping } from './emojione_light';
import emojione from 'emojione';
import Trie from 'substring-trie';
import toV6donEmoji from './emoji-v6don';

const trie = new Trie(Object.keys(unicodeMapping));

const emojify = str => str.replace(/([^<]*)(<[^>]*>)?/mg, (all, raw, tag) => {
  const u2i = txt => {
    let match;
    let rtn = "";
    while (txt.length && !(match = trie.search(txt))) {
      rtn += txt[0];
      txt = txt.slice(1);
    }
    if (match) {
      const unicodeStr = match;
      if (unicodeStr in unicodeMapping) {
        const [filename, shortCode] = unicodeMapping[unicodeStr];
        const alt      = unicodeStr;
        const replacement = `<img draggable="false" class="emojione" alt="${alt}" title=":${shortCode}:" src="/emoji/${filename}.svg" />`;
        rtn += replacement + u2i(txt.slice(unicodeStr.length));
      }
    }
    return rtn;
  }
  
  let insideShortname = false;
  return raw.split(":").reduce((rtn, txt, idx, arr) => {
    if (insideShortname) {
      let shortname = `:${txt}:`;
      if (idx != arr.length - 1 && shortname in emojione.emojioneList) {
        const unicode = emojione.emojioneList[shortname].unicode[emojione.emojioneList[shortname].unicode.length - 1];
        const alt = emojione.convert(unicode.toUpperCase());
        rtn += `<img draggable="false" class="emojione" alt="${alt}" title="${shortname}" src="/emoji/${unicode}.svg" />`;
        insideShortname = false;
      }
      else rtn += ":" + u2i(txt);
    }
    else {
      rtn += u2i(txt);
      insideShortname = true;
    }
    return rtn;
  }, "") + (tag || "");
});

const emojify_v6don = text =>
  toV6donEmoji("post", emojify(toV6donEmoji("pre", text)));
  
export default emojify_v6don;
