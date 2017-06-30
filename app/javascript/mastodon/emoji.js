import emojione from 'emojione';
import toV6donEmoji from './emoji-v6don';

const toImage = str => shortnameToImage(unicodeToImage(str));

const unicodeToImage = str => {
  const mappedUnicode = emojione.mapUnicodeToShort();

  return str.replace(emojione.regUnicode, unicodeChar => {
    if (typeof unicodeChar === 'undefined' || unicodeChar === '' || !(unicodeChar in emojione.jsEscapeMap)) {
      return unicodeChar;
    }

    const unicode  = emojione.jsEscapeMap[unicodeChar];
    const short    = mappedUnicode[unicode];
    const filename = emojione.emojioneList[short].fname;
    const alt      = emojione.convert(unicode.toUpperCase());

    return `<img draggable="false" class="emojione" alt="${alt}" title="${short}" src="/emoji/${filename}.svg" />`;
  });
};

const shortnameToImage = str => str.replace(/([^<]*)(<[^>]*>)?/mg, (all, raw, tag) => {
  let insideShortname = false;
  return raw.split(":").reduce((rtn, shortname) => {
    if (insideShortname) {
      if (shortname in emojione.emojioneList) {
        const unicode = emojione.emojioneList[shortname].unicode[emojione.emojioneList[shortname].unicode.length - 1];
        const alt = emojione.convert(unicode.toUpperCase());
        rtn += `<img draggable="false" class="emojione" alt="${alt}" title="${shortname}" src="/emoji/${unicode}.svg" />`;
        insideShortname = false;
      }
      else rtn += ":" + shortname;
    }
    else {
      rtn += shortname;
      insideShortname = true;
    }
    return rtn;
  }, "") + (tag || "");
});

export default function emojify(text) {
  return toV6donEmoji("post", toImage(toV6donEmoji("pre", text)));
};
