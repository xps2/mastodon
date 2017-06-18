import emojione from 'emojione';

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

const shortnameToImage = str => str.replace(emojione.regShortNames, shortname => {
  if (typeof shortname === 'undefined' || shortname === '' || !(shortname in emojione.emojioneList)) {
    return shortname;
  }

  const unicode = emojione.emojioneList[shortname].unicode[emojione.emojioneList[shortname].unicode.length - 1];
  const alt     = emojione.convert(unicode.toUpperCase());

  return `<img draggable="false" class="emojione" alt="${alt}" title="${shortname}" src="/emoji/${unicode}.svg" />`;
});

const hesc = raw => {
  var ent = false;
  return raw.replace(/./ug, c => {
    if (ent) {
      if (c == ';') ent = false;
    }
    else if (c == '&') {
       ent = true;
    }
    else {
      c = `&#${c.codePointAt(0)};`;
    }
    return c;
  })
};

const localEmoji = {
  pre: [
    {
      re: /((?:✨|(?::sparkles:))+)( ?IPv6[^<>\s]*? ?)((?:✨|(?::sparkles:))+)/ug,
      fmt: (m, s1, ip, s2) => {
        var f = k => k.replace(/✨/g, "<kira1/>").replace(/:sparkles:/g, "<kira2/>");
        
        for (var iptrim = ip.slice(ip.indexOf("IPv6") + 4), len = 0; iptrim.length && len < 7; len++) {
          if (iptrim[0] == ":") {
            var rr = /^:[\w\d-]+:/.exec(iptrim);
            if (!rr) return m;
            iptrim = iptrim.slice(rr[0].length);
          }
          else if (iptrim[0] == "&") {
            iptrim = iptrim.replace(/&.*?;/, "");
          }
          else if (iptrim.codePointAt(0) >= 65536) {
            iptrim = iptrim.slice(2);
          }
          else {
            iptrim = iptrim.slice(1);
          }
        }
        if (iptrim.length) return m;
        return `${f(s1)}<ipv6>${ip}</ipv6>${f(s2)}`;
      }
    },
  ],
  stamp: [
    {re: /5,?000\s?兆円/g, img: '5000tyoen.svg'},
    {re: /5,?000兆/g, img: '5000tyo.svg'},
  ],
  post_raw: [],
  post_all: [
    {re: /<kira1\/>/g, fmt: () => `<span class="v6don-kira">${unicodeToImage("✨")}</span>`},
    {re: /<kira2\/>/g, fmt: () => `<span class="v6don-kira">${unicodeToImage(":sparkles:")}</span>`},
    {re: /<ipv6>(.*?)<\/ipv6>/mg, fmt: (m, ip) => `<span class="v6don-nobi">${ip}</span>`},
  ],
};

export default function emojify(text) {
  var tr = arr =>
    arr.reduce((t, e) =>
      t.replace(/([^<]*)(<[^>]*>)?/mg, (all, raw, tag) =>
        raw.replace(e.re, e.fmt) + (tag || '')), text)

  text = tr(localEmoji.pre)
  
  text = toImage(text);
  
  text = tr(localEmoji.stamp.map(e => {
    e.fmt = (m) => `<img alt="${hesc(m)}" src="/emoji/${e.img}"/>`;
    return e;
  }))
  text = tr(localEmoji.post_raw);
  text = localEmoji.post_all.reduce((t, e) => t.replace(e.re, e.fmt), text);
  
  return text;
};
