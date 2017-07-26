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

const apply_without_tag = (str, f) => str.replace(/([^<]*)(<[^>]*>)?/mg, (all, raw, tag) => f(raw) + (tag || ''));

localEmoji.pre.push(...byre.pre.map(e => e.tag ?
  str => str.replace(e.re, e.fmt) :
  str => apply_without_tag(str, s => s.replace(e.re, e.fmt))));
localEmoji.post.push(...byre.post.map(e => e.tag ?
  str => str.replace(e.re, e.fmt) :
  str => apply_without_tag(str, s => s.replace(e.re, e.fmt))));

const shorttab = {};
[
    "nicoru", "iine", "irane", "mayo",
].forEach(name => {
  shorttab[name] = {
    remtest: rem => /^\d+$/.test(rem),
    append: (_, rem) => rem ? `style="transform: rotate(${rem}deg)"` : '',
  };
});
shorttab.realtek = {path: () => "/emoji/proprietary/realtek.svg", append: () => `style="width: 4.92em"`};

const le_curry = (trie, replacer) => function le_rec(cur, prev = '') {
  let idx = cur.indexOf(':');
  if (idx == -1) return prev + cur;
  prev += cur.slice(0, idx);
  cur = cur.slice(idx + 1);
  idx = cur.indexOf(':');
  if (idx == -1) return prev + ':' + cur;
  let tag = cur.slice(0, idx);
  cur = cur.slice(idx);
  let match = trie.search(tag);
  if (!match) return le_rec(cur, prev + ':' + tag);
  let rem;
  if (tag == match) {
    rem = null;
  }
  else if (shorttab[match].remtest) {
    rem = tag.slice(match.length);
    if (!shorttab[match].remtest(rem)) return le_rec(cur, prev + ':' + tag);
  }
  else {
    return le_rec(cur, prev + ':' + tag);
  }
  return le_rec(cur.slice(1), prev + replacer(match, rem));
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
