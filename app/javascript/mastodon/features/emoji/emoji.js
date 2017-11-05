import { autoPlayGif } from '../../initial_state';

import highlight from '../v6don/highlighter';

const emojify = (str, customEmojis = {}) => {
  if (!Object.keys(customEmojis).length) return str;
  let rtn = '', prevcolon = null;
  const tagre = /[<:]/g;
  const invre = /[<]/g;
  let re = tagre, depth;
  while (re.lastIndex < str.length) {
    const testbegin = re.lastIndex;
    const tag = re.exec(str);
    if (!tag) {
      rtn += str.slice(re.lastIndex);
      break;
    }
    const c = tag[0];
    let i = tag.index;
    if (c === ':') {
      if (prevcolon === null) {
        prevcolon = i;
        rtn += str.slice(testbegin, i);
      } else {
        const shortname = str.slice(prevcolon, i + 1);
        if (shortname in customEmojis) {
          const filename = autoPlayGif ? customEmojis[shortname].url : customEmojis[shortname].static_url;
          const replacement = `<img draggable="false" class="emojione" alt="${shortname}" title="${shortname}" src="${filename}" />`;
          rtn += replacement;
          prevcolon = null;
        } else {
          rtn += str.slice(prevcolon, i);
          prevcolon = i;
        }
      }
    } else { // <
      let begin;
      if (prevcolon !== null) {
        begin = prevcolon;
        prevcolon = null;
      } else {
        begin = testbegin;
      }
      let next = str.indexOf('>', i + 1) + 1;
      if (!next) next = str.length;
      if (re === tagre && str.startsWith('<span class="invisible">', i)) {
        re = invre;
        depth = 1;
      } else if (re === invre) {
        if (str[i + 1] === '/') { // closing tag
          depth--;
          if (!depth) {
            re = tagre;
          }
        } else if (str[next - 2] !== '/') { // opening tag
          depth++;
        }
      }
      rtn += str.slice(begin, next);
      re.lastIndex = next;
    }
  }
  return rtn;
};

const emojify_v6don = (text, customEmojis) => emojify(highlight(text, customEmojis), customEmojis);

export { emojify as emojify_original };
export default emojify_v6don;

export const buildCustomEmojis = (customEmojis) => {
  const emojis = [];

  customEmojis.forEach(emoji => {
    const shortcode = emoji.get('shortcode');
    const url       = autoPlayGif ? emoji.get('url') : emoji.get('static_url');
    const name      = shortcode.replace(':', '');

    emojis.push({
      id: name,
      name,
      short_names: [name],
      text: '',
      emoticons: [],
      keywords: [name],
      imageUrl: url,
      custom: true,
    });
  });

  return emojis;
};
