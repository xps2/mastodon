import Trie from 'substring-trie';
import emojify from './emoji';
import monosvg from '../images/v6don-monosvg';

// ↓の配列に絵文字置換対象の文字列を受け取って置換を施した文字列を返すという
// 関数を追加していく
const trlist = [];
const highlight = text => trlist.reduce((t, e) => e(t), text);
export default highlight;

// ユーティリティ
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

const unesc = str => {
  if (str.indexOf('<') != -1) {
    throw new Error("can't unescape string containing tags");
  }
  let elem = document.createElement("div");
  elem.innerHTML = str;
  return elem.textContent;
}

const ununesc = str => str.replace(/[&<>]/g, e => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"})[e]);

const apply_without_tag = f => str => {
  let rtn = '';
  while (str) {
    let tagbegin = str.indexOf('<');
    if (tagbegin == -1) {
      rtn += f(str);
      break;
    }
    rtn += f(str.slice(0, tagbegin));
    let tagend = str.indexOf('>', tagbegin + 1) + 1;
    if (!tagend) {
      rtn += str.slice(tagbegin);
      break;
    }
    rtn += str.slice(tagbegin, tagend);
    str = str.slice(tagend);
  }
  return rtn;
}

// ここから関数登録

// ^H^H
trlist.push(apply_without_tag(s => {
  let rtn = ''
  s = unesc(s);
  while (s) {
    let rr = /(\^H)+/i.exec(s);
    if (!rr) break;
    let delend = rr.index;
    if (!delend) {
      rtn += rr[0];
      s = s.slice(rr[0].length);
      continue;
    }
    let dellen = rr[0].length / 2;
    let delstart = delend;
    while (delstart > 0 && dellen--) {
      if (/[\udc00-\udfff]/.test(s[--delstart])) delstart--;
    }
    if (delstart < 0) delstart = 0;

    rtn += `${ununesc(s.slice(0, delstart))}<del>${hesc(ununesc(s.slice(delstart, delend)))}</del><span class="invisible">${rr[0]}</span>`
    s = s.slice(delend + rr[0].length);
  }
  return rtn + ununesc(s);
}));

// 置換をString.replace()に投げるやつ
const byre = [
  {tag: true, re: /(<a\s[^>]*>)(.*?:don:.*?)<\/a>/mg, fmt: (all, tag, text) => tag + 
    text.replace(/:don:/g, hesc(":don:")) + "</a>"
  },
  {re: /:don:/g, fmt: `<a href="https://mstdn.maud.io/">:don:</a>`},
];

byre.push(...[
  {re: /5,?000\s?兆円/g, img: '5000tyoen.svg'},
  {re: /5,?000兆/g, img: '5000tyo.svg'},
].map(e => {
    e.fmt = (m) => `<img alt="${hesc(m)}" src="/emoji/v6don/${e.img}"/>`;
    return e;
}));

byre.push({
  re: /(‡+|†+)([^†‡]{1,30}?)(‡+|†+)/g,
  fmt: (m, d1, txt, d2) => {
    if (d1[0] != d2[0]) return m;
    return `<span class="v6don-tyu2"><span class="v6don-dagger">${d1}</span>${txt}<span class="v6don-dagger">${d2}</span></span>`;
  },
});

byre.push({
  re: /(✨+)( ?IPv6[^✨]*)(✨+)/ug,
  fmt: (m, s1, ip, s2) => {
    let f = k => k.replace(/✨/g, s => `<span class="v6don-kira">${s}</span>`);
    
    let ipdeco = ""
    ip = highlight(ip);
    for (let chars = 0, delay = 0; ip.length && chars < 11; chars++) {
      let deco = true, decolen;
      let rr = /^\s/u.exec(ip);
      if (rr) {
        deco = false;
        decolen = rr[0].length;
      }
      else if (ip[0] == "&") {
        rr = /&.*?;/.exec(ip);
        decolen = rr[0].length;
      }
      else if (ip[0] == "<") {
        if (/^<svg /.test(ip)) {
          deco = true;
          // BUG: SVGが入れ子になってると死ぬ
          decolen = ip.indexOf('</svg>') + '</svg>'.length;
        }
        else {
          deco = /^<img\s/i.test(ip);
          rr = /<[^>]*?>/.exec(ip);
          decolen = rr[0].length;
        }
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


trlist.push(...byre.map(e => e.tag ?
  str => str.replace(e.re, e.fmt) :
  apply_without_tag(s => s.replace(e.re, e.fmt))));

// :tag:の置換
const shorttab = {};

[
  "nicoru", "iine", "irane", "mayo",
].forEach(name => {
  shorttab[name] = {
    remtest: (rem) => /^\d+$/.test(rem),
    append: (_, rem) => rem ? `style="transform: rotate(${rem}deg)"` : '',
  };
});
[
  "rmn_e",
].forEach(name => {
  shorttab[name] = {};
})
shorttab.realtek = {path: () => "/emoji/proprietary/realtek.svg", append: () => `style="width: 4.92em"`};

const le_curry = (trie, remtest, replacer) => (cur) => {
  let prev = '';
  for (;;) {
    let tagbegin = cur.indexOf(':') + 1;
    if (!tagbegin) break;
    let tagend = cur.indexOf(':', tagbegin);
    if (tagend == -1) break;
    let tag = cur.slice(tagbegin, tagend);
    let match = trie.search(tag);
    let replace = false, rem = null;
    if (match) {
      if (tag == match) {
        replace = true;
      }
      else {
        rem = tag.slice(match.length);
        replace = remtest && remtest(match, rem);
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

trlist.push(apply_without_tag(raw =>
  le_curry(
    new Trie(Object.keys(shorttab)),
    (match, rem) => shorttab[match].remtest && shorttab[match].remtest(rem),
    (match, rem) => {
      let name = match + (rem || '');
      let rtn = `<img class="emojione" alt=":${name}:" title=":${name}:" src="`
      rtn += (shorttab[match].path ? shorttab[match].path(match, rem) : `/emoji/v6don/${match}.svg`) + '"';
      if (shorttab[match].append) {
        rtn += ' ' + (shorttab[match].append(match, rem) || '');
      }
      rtn += "/>";
      return rtn;
    }
  )(raw)));

trlist.push(apply_without_tag(raw =>
  le_curry(
    new Trie(Object.keys(monosvg)),
    null,
    (name) => monosvg[name]
  )(raw)));

// 絵文字化させたくないやつ
trlist.push(apply_without_tag(s => s.replace(/[®©™■-◿〽]/ug, c => hesc(c))));
