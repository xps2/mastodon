import Trie from 'substring-trie';
import emojify from './emoji';

const localEmoji = {
  pre: [], post: []
};
export default function(order, text) {
  return localEmoji[order].reduce((t, e) => e(t), text);
};

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

const byre = {
  pre: [],
  post: [
    {tag: true, re: /(<a\s[^>]*>)(.*?:don:.*?)<\/a>/mg, fmt: (all, tag, text) => tag + 
      text.replace(/:don:/g, hesc(":don:")) + "</a>"
    },
    {re: /:don:/g, fmt: `<a href="https://mstdn.maud.io/">:don:</a>`},
  ],
};

byre.post.push(...[
  {re: /5,?000\s?兆円/g, img: '5000tyoen.svg'},
  {re: /5,?000兆/g, img: '5000tyo.svg'},
].map(e => {
    e.fmt = (m) => `<img alt="${hesc(m)}" src="/emoji/v6don/${e.img}"/>`;
    return e;
}));

byre.pre.push({
  re: /(‡+|†+)([^†‡]{1,30}?)(‡+|†+)/g,
  fmt: (m, d1, txt, d2) => {
    if (d1[0] != d2[0]) return m;
    return `<span class="v6don-tyu2"><span class="v6don-dagger">${d1}</span>${txt}<span class="v6don-dagger">${d2}</span></span>`;
  },
});

byre.pre.push({
  re: /(✨+)( ?IPv6[^✨]*)(✨+)/ug,
  fmt: (m, s1, ip, s2) => {
    let f = k => k.replace(/✨/g, s => `<span class="v6don-kira">${s}</span>`);
    
    let ipdeco = ""
    ip = emojify(ip);
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
      else if (ip[0] == "<") {
        deco = /^<img\s/i.test(ip);
        rr = /<[^>]*?>/.exec(ip);
        decolen = rr[0].length;
      }
      else if (ip.codePointAt(0) >= 65536) {
        decolen = 2;
      }
      else {
        decolen = 1;
      }
      
      if (deco) {
        ipdeco += `<span class="v6don-wave" style="animation-delay: ${delay}ms">${ip.slice(0, decolen)}</span>`;
        delay += 100;
      }
      else {
        ipdeco += ip.slice(0, decolen);
      }
      ip = ip.slice(decolen);
    }
    
    if (ip.length) {
      return m;
    }
    
    return `${f(s1)}${ipdeco}${f(s2)}`;
  }
});

const apply_without_tag = (str, f) => {
  let rtn = '';
  while (str) {
    let tagbegin = str.indexOf('<');
    if (tagbegin == -1) {
      rtn += f(str);
      break;
    }
    rtn += f(str.slice(0, tagbegin));
    str = str.slice(tagbegin);
    let tagend = str.indexOf('>') + 1;
    if (!tagend) {
      rtn += str;
      break;
    }
    rtn += str.slice(0, tagend);
    str = str.slice(tagend);
  }
  return rtn;
}

localEmoji.pre.push(...byre.pre.map(e => e.tag ?
  str => str.replace(e.re, e.fmt) :
  str => apply_without_tag(str, s => s.replace(e.re, e.fmt))));
localEmoji.post.push(...byre.post.map(e => e.tag ?
  str => str.replace(e.re, e.fmt) :
  str => apply_without_tag(str, s => s.replace(e.re, e.fmt))));

const shorttab = {};

["nicoru", "iine", "irane", "mayo",].forEach(name => {
  shorttab[name] = {
    remtest: (_, rem) => /^\d+$/.test(rem),
    append: (_, rem) => rem ? `style="transform: rotate(${rem}deg)"` : '',
  };
});
["rmn_e", "tree", "tama"].forEach(name => {
  shorttab[name] = {};
})
shorttab.realtek = {path: () => "/emoji/proprietary/realtek.svg", append: () => `style="width: 4.92em"`};

const le_curry = (trie, replacer) => (cur) => {
  let prev = '';
  for (;;) {
    let tagbegin = cur.indexOf(':') + 1;
    if (!tagbegin) break;
    let tagend = cur.slice(tagbegin).indexOf(':');
    if (tagend == -1) break;
    tagend += tagbegin;
    let tag = cur.slice(tagbegin, tagend);
    let match = trie.search(tag);
    let replace = false, rem = null;
    if (match) {
      if (tag == match) {
        replace = true;
      }
      else {
        rem = tag.slice(match.length);
        replace = shorttab[match].remtest && shorttab[match].remtest(match, rem);
      }
    }
    if (replace) {
      prev += cur.slice(0, tagbegin - 1) + replacer(match, rem);
      cur = cur.slice(tagend + 1);
    }
    else {
      prev += cur.slice(0, tagend);
      cur = cur.slice(tagend);
    }
  }
  return prev + cur;
};

localEmoji.post.push(str => apply_without_tag(str, raw =>
  le_curry(new Trie(Object.keys(shorttab)), (match, rem) => {
    let name = match + (rem || '');
    let rtn = `<img class="emojione" alt=":${name}:" title=":${name}:" src="`
    rtn += (shorttab[match].path ? shorttab[match].path(match, rem) : `/emoji/v6don/${match}.svg`) + '"';
    if (shorttab[match].append) {
      rtn += ' ' + (shorttab[match].append(match, rem) || '');
    }
    rtn += "/>";
    return rtn;
  })(raw)));
