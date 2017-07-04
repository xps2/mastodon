const hesc = raw => {
  let ent = false;
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
    {re: /:[\dA-Fa-f]{2,4}:/g, fmt: af => hesc(af)},
  ],
  post: [
    {tag: true, re: /(<a\s[^>]*>)(.*?:don:.*?)<\/a>/mg, fmt: (all, tag, text) => tag + 
      text.replace(/:don:/g, hesc(":don:")) + "</a>"
    },
    {re: /:don:/g, fmt: `<a href="https://mstdn.maud.io/">:don:</a>`},
    {tag: true, re: /<kira>(.*?)<\/kira>/mg, fmt: (m, ip) => `<span class="v6don-kira">${ip}</span>`},
    {tag: true, re: /<ipv6 ([^>]*)>(.*?)<\/ipv6>/mg, fmt: (m, style, txt) => `<span class="v6don-wave" ${style}>${txt}</span>`},
  ],
};

localEmoji.post.push(...[
  {re: /5,?000\s?兆円/g, img: '5000tyoen.svg'},
  {re: /5,?000兆/g, img: '5000tyo.svg'},
].map(e => {
    e.fmt = (m) => `<img alt="${hesc(m)}" src="/emoji/v6don/${e.img}"/>`;
    return e;
}));

localEmoji.pre.push({
  re: /((?:✨|(?::sparkles:))+)( ?IPv6[^<>\s]*? ?)((?:✨|(?::sparkles:))+)/ug,
  fmt: (m, s1, ip, s2) => {
    let f = k => k.replace(/✨|:sparkles:/g, s => `<kira>${s}</kira>`);
    
    let ipdeco = ""
    for (let chars = 0, delay = 0; ip.length && chars < 11; chars++) {
      let deco = true, decolen;
      let rr = /^\s/u.exec(ip);
      if (rr) {
        deco = false;
        decolen = rr[0].length;
      }
      else if (ip[0] == ":") {
        rr = /^:[\w\d-]+:/.exec(ip);
        if (!rr) {
          return m;
        }
        decolen = rr[0].length;
      }
      else if (ip[0] == "&") {
        rr = /&.*?;/.exec(ip);
        decolen = rr[0].length;
      }
      else if ((rr = /^5,?000\s?兆円?/.exec(ip))) {
        decolen = rr[0].length
      }
      else if (ip.codePointAt(0) >= 65536) {
        decolen = 2;
      }
      else {
        decolen = 1;
      }
      
      if (deco) {
        ipdeco += `<ipv6 style="animation-delay: ${delay}ms">${ip.slice(0, decolen)}</ipv6>`;
        delay += 100;
      }
      ip = ip.slice(decolen);
    }
    
    if (ip.length) {
      return m;
    }
    
    return `${f(s1)}${ipdeco}${f(s2)}`;
  }
});


localEmoji.post.push(...[
  {re: /:realtek:/g, img: "../proprietary/realtek.svg", width: 4.92},
].map(e => {
  let style = e.width ? `style="width: ${e.width}em"` : "";
  e.fmt = (m) => `<img class="emojione" alt="${m}" title="${m}" src="/emoji/v6don/${e.img}" ${style}/>`;
  return e;
}));

localEmoji.post.push(...[
  "nicoru", "iine", "irane", "mayo",
].map(e => {
  let rtn = {};
  rtn.re = new RegExp(`:${e}(\\d*):`, "g");
  rtn.fmt = (m, deg) => `<img class="emojione" alt="${m}" title="${m}" src="/emoji/v6don/${e}.svg" style="transform: rotate(${deg || 0}deg)"/>`
  return rtn;
}));


export default function(order, text) {
  return localEmoji[order].reduce((t, e) => e.tag ?
    t.replace(e.re, e.fmt) :
    t.replace(/([^<]*)(<[^>]*>)?/mg, (all, raw, tag) =>
      raw.replace(e.re, e.fmt) + (tag || ''))
  , text);
};
