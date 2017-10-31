import highlight from '../v6don/highlighter';

const tagtab = { '<' : '>', '&': ';' };

let allowAnimations = false;

const emojify = (str, customEmojis = {}) => {
  let rtn = '', prevcolon = null;
  const tagre = /[<&:]/g;
  while (tagre.lastIndex < str.length) {
    const testbegin = tagre.lastIndex;
    const tag = tagre.exec(str);
    if (!tag) {
      rtn += str.slice(tagre.lastIndex);
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
          const filename = allowAnimations ? customEmojis[shortname].url : customEmojis[shortname].static_url;
          const replacement = `<img draggable="false" class="emojione" alt="${shortname}" title="${shortname}" src="${filename}" />`;
          rtn += replacement;
          prevcolon = null;
        } else {
          rtn += str.slice(prevcolon, i);
          prevcolon = i;
        }
      }
    } else { // <, &
      let begin;
      if (prevcolon !== null) {
        begin = prevcolon;
        prevcolon = null;
      } else {
        begin = testbegin;
      }
      let next = str.indexOf(tagtab[c], i + 1) + 1;
      if (!next) next = str.length;
      rtn += str.slice(begin, next);
      tagre.lastIndex = next;
    }
  }
  return rtn;
};

const emojify_v6don = (text, customEmojis) => emojify(highlight(text, customEmojis), customEmojis);

export { emojify as emojify_original };
export default emojify_v6don;

export const buildCustomEmojis = (customEmojis, overrideAllowAnimations = false) => {
  const emojis = [];

  allowAnimations = overrideAllowAnimations;

  customEmojis.forEach(emoji => {
    const shortcode = emoji.get('shortcode');
    const url       = allowAnimations ? emoji.get('url') : emoji.get('static_url');
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
