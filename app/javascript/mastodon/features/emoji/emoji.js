import highlight from '../v6don/highlighter';

const tagtab = { '<' : '>', '&': ';' };

let allowAnimations = false;

const emojify = (str, customEmojis = {}) => {
  let rtn = '', tag;
  while ((tag = /[<&:]/.exec(str))) {
    let i = tag.index, c = tag[0], replacement = '', rend;
    if (c === ':') {
      if (!(() => {
        rend = str.indexOf(':', i + 1) + 1;
        if (!rend) return false; // no pair of ':'
        const lt = str.indexOf('<', i + 1);
        if (!(lt === -1 || lt >= rend)) return false; // tag appeared before closing ':'
        const shortname = str.slice(i, rend);
        // now got a replacee as ':shortname:'
        // if you want additional emoji handler, add statements below which set replacement and return true.
        if (shortname in customEmojis) {
          const filename = allowAnimations ? customEmojis[shortname].url : customEmojis[shortname].static_url;
          replacement = `<img draggable="false" class="emojione" alt="${shortname}" title="${shortname}" src="${filename}" />`;
          return true;
        }
        return false;
      })()) rend = ++i;
    } else { // <, &
      rend = str.indexOf(tagtab[c], i + 1) + 1;
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
