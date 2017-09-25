import highlight from './v6don/highlighter';

const emojify = (str, customEmojis = {}) => {
  let rtn = '';
  for (;;) {
    let i = 0, tag;
    while (i < str.length && (tag = '<&:'.indexOf(str[i])) === -1) {
      i += str.codePointAt(i) < 65536 ? 1 : 2;
    }
    let rend, replacement = '';
    if (i === str.length) {
      break;
    } else if (str[i] === ':') {
      if (!(() => {
        rend = str.indexOf(':', i + 1) + 1;
        if (!rend) return false; // no pair of ':'
        const lt = str.indexOf('<', i + 1);
        if (!(lt === -1 || lt >= rend)) return false; // tag appeared before closing ':'
        const shortname = str.slice(i, rend);
        // now got a replacee as ':shortname:'
        // if you want additional emoji handler, add statements below which set replacement and return true.
        if (shortname in customEmojis) {
          replacement = `<img draggable="false" class="emojione" alt="${shortname}" title="${shortname}" src="${customEmojis[shortname]}" />`;
          return true;
        }
        return false;
      })()) rend = ++i;
    } else { // <, &
      rend = str.indexOf('>;'[tag], i + 1) + 1;
      if (!rend) break;
      i = rend;
    }
    rtn += str.slice(0, i) + replacement;
    str = str.slice(rend);
  }
  return rtn + str;
};

const emojify_v6don = (text, customEmojis) => emojify(highlight(text, customEmojis), customEmojis);

export { emojify as emojify_original };
export default emojify_v6don;

export const buildCustomEmojis = customEmojis => {
  const emojis = [];

  customEmojis.forEach(emoji => {
    const shortcode = emoji.get('shortcode');
    const url       = emoji.get('url');
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
