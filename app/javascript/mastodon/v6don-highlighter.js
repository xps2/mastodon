import Trie from 'substring-trie';

// ↓の配列に絵文字置換対象の文字列を受け取って置換を施した文字列を返すという
// 関数を追加していく
const trlist = {pre: [], rec:[], post: []};
const tr = (text, order) => trlist[order].reduce((t, f) => f(t), text);
const highlight = text => tr(text, "rec");
const highlight_root = text => ["pre", "rec", "post"].reduce((t, o) => tr(t, o), text);
export default highlight_root;

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
  if (str.indexOf('<') != -1 || str.indexOf('>') != -1) {
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
      // rtn += f(str);
      // break;
      // spec を通すため片割れの ">" の判別
      while ((tagbegin = str.indexOf('>')) != -1) {
        rtn += (tagbegin ? f(str.slice(0, tagbegin)) : '') + '>';
        str = str.slice(tagbegin + 1);
      }
      rtn += str ? f(str) : '';
      break;
    }
    rtn += tagbegin ? f(str.slice(0, tagbegin)) : '';
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
trlist.pre.push(apply_without_tag(s => {
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
const byre = [];

byre.push({
  order: "pre",
  re: /((‡+|†+)([^†‡]{1,30}?))(‡+|†+)/,
  fmt: (m, skip, d1, txt, d2) => {
    if (d1[0] != d2[0]) return null;
    return `<span class="v6don-tyu2"><span class="v6don-dagger">${d1}</span>${txt}<span class="v6don-dagger">${d2}</span></span>`;
  },
});

byre.push({
  order: "pre",
  re: /((✨+)( ?IPv6[^✨]*))(✨+)/u,
  fmt: (m, skip, s1, ip, s2) => {
    let f = k => k.replace(/./ug, `<span class="v6don-kira">✨</span>`);
    
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
      return null;
    }
    
    return `${f(s1)}${ipdeco}${f(s2)}`;
  }
});

byre.push(...[
  {re: /5,?000\s?兆円/g, img: '5000tyoen.svg'},
  {re: /5,?000兆/g, img: '5000tyo.svg'},
].map(e => {
    e.fmt = (m) => `<img alt="${hesc(m)}" src="/emoji/v6don/${e.img}"/>`;
    return e;
}));

byre.push(...[
  {tag: true, re: /(<a\s[^>]*>)(.*?:don:.*?)<\/a>/mg, fmt: (all, tag, text) => tag + 
    text.replace(/:don:/g, hesc(":don:")) + "</a>"
  },
  {re: /:don:/g, fmt: `<a href="https://mstdn.maud.io/">:don:</a>`},
  {order: "post", re: /[■-◿〽]/ug, fmt: c => `&#${c.codePointAt(0)};`},
]);

const replace_by_re = (re, fmt) => str => {
  if (re.global) return str.replace(re, fmt);
  
  let rr;
  let rtn = '';
  while (str && (rr = re.exec(str))) {
    let replacement = fmt(...rr);
    if (replacement === null) {
      let idx = rr.index + rr[1].length;
      rtn += str.slice(0, idx);
      str = str.slice(idx);
    }
    else {
      rtn += str.slice(0, rr.index) + replacement;
      str = str.slice(rr.index + rr[0].length);
    }
  }
  return rtn + str;
}

byre.forEach(e => {
  trlist[e.order ? e.order : "rec"].push(e.tag ? replace_by_re(e.re, e.fmt) : apply_without_tag(replace_by_re(e.re, e.fmt)));
});

// :tag:の置換

// 共通処理
const shortname_match = (list, remtest, replacer) => apply_without_tag(cur => {
  let prev = '';
  let trie = new Trie(list);
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
});

// :tag: をフツーにimgで返すやつ
const shorttab = {};
[
  "rmn_e",
].forEach(name => {
  shorttab[name] = {};
});
// 回転対応絵文字
[
  "nicoru", "iine", "irane", "mayo",
].forEach(name => {
  shorttab[name] = {
    remtest: (rem) => /^\d+$/.test(rem),
    append: (_, rem) => rem ? `style="transform: rotate(${rem}deg)"` : '',
  };
});
shorttab.realtek = {path: () => "/emoji/proprietary/realtek.svg", append: () => `style="width: 4.92em"`};

trlist.rec.push(shortname_match(
  Object.keys(shorttab),
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
  }));

// :tag: の単色SVG版
const monosvg = {};
["hiki", "hohoemi", "ken", "tama", "tree"].forEach(n => {monosvg[n] = null});

trlist.rec.push(shortname_match(Object.keys(monosvg), null, (name) => {
  if (monosvg[name]) return monosvg[name];

  if (monosvg[name] === null) {
    // SVGを読みに行く
    monosvg[name] = ''; // 空文字列で読み込み中を提示
    // 取得処理
    fetch(`/emoji/v6don/${name}.svg`).then(res => {
      let escname = hesc(name);
      if (res.ok) {
        res.text().then(txt => {
          // 読み込めた時、以後はこのSVGテキストをそのまま使う
          monosvg[name] = txt.replace(
            /<style[\s\S]*?<\/style>/m, ''
          ).replace(
            />/, ` class="emojione v6don-monosvg"><title>:${escname}:</title><desc>:${escname}:</desc>`
          ).replace(/\n/mg, ' ').trim();
          // 仮置きしたspanをDOMで置換
          let dp = new DOMParser();
          let svg = dp.parseFromString(monosvg[name], "application/xml").documentElement;
          let replace = () => {
            [].forEach.call(document.body.getElementsByClassName(`monosvg-replacee-${name}`) || [], e => {
              e.parentNode.replaceChild(svg.cloneNode(true), e);
            })
          };
          replace();
          // 不安なのでもう1回する(謎)
          setTimeout(replace, 1500);
        });
      }
      else {
        // 読み込めなかった時は再取得を促す
        monosvg[name] = null;
      }
    });
  }
  // SVG取得まで仮置き
  return `<span class="monosvg-replacee-${name}">:${hesc(name)}:</span>`;
}));
