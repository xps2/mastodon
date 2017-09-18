import Trie from 'substring-trie';

// ↓の配列に絵文字置換対象の文字列を受け取って置換を施した文字列を返すという
// 関数を追加していく
const trlist = { pre: [], rec:[], post: [] };
const tr = (text, order) => trlist[order].reduce((t, f) => f(t), text);
const highlight = text => tr(text, 'rec');
const highlight_root = text => ['pre', 'rec', 'post'].reduce((t, o) => tr(t, o), text);
export default highlight_root;

// ユーティリティ
const hesc = raw => {
  let ent = false;
  return raw.replace(/./ug, c => {
    if (ent) {
      if (c === ';') ent = false;
    } else if (c === '&') {
      ent = true;
    } else {
      c = `&#${c.codePointAt(0)};`;
    }
    return c;
  });
};

const unesc = str => {
  if (str.indexOf('<') !== -1 || str.indexOf('>') !== -1) {
    throw new Error('can\'t unescape string containing tags');
  }
  let elem = document.createElement('div');
  elem.innerHTML = str;
  return elem.textContent;
};

const ununesc = str => str.replace(/[&<>]/g, e => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[e]);

const apply_without_tag = f => str => {
  let rtn = '';
  while (str) {
    let tagbegin = str.indexOf('<');
    if (tagbegin === -1) {
      // rtn += f(str);
      // break;
      // spec を通すため片割れの ">" の判別
      while ((tagbegin = str.indexOf('>')) !== -1) {
        rtn += (tagbegin ? f(str.slice(0, tagbegin)) : '') + '>';
        str = str.slice(tagbegin + 1);
      }
      rtn += str ? f(str) : '';
      break;
    } else if (tagbegin) {
      // < に到達する前に > に遭遇する場合に備える
      let gt;
      while ((gt = str.indexOf('>')) < tagbegin && gt >= 0) {
        rtn += gt ? f(str.slice(0, gt)) + '>' : '';
        str = str.slice(gt + 1);
        tagbegin -= gt + 1;
      }
      rtn += tagbegin ? f(str.slice(0, tagbegin)) : '';
    }

    let tagend = str.indexOf('>', tagbegin + 1) + 1;
    if (!tagend) {
      rtn += str.slice(tagbegin);
      break;
    }
    rtn += str.slice(tagbegin, tagend);
    str = str.slice(tagend);
  }
  return rtn;
};

// ここから関数登録

// ^H^H
trlist.pre.push(apply_without_tag(s => {
  let rtn = '';
  s = unesc(s);
  while (s) {
    let rr = /(\^H)+/i.exec(s);
    if (!rr) break;
    let delend = rr.index;
    if (!delend || /\s/.test(s[delend - 1])) {
      rtn += s.slice(0, delend);
      rtn += rr[0];
      s = s.slice(delend + rr[0].length);
      continue;
    }
    let dellen = rr[0].length / 2;
    let delstart = delend;
    while (delstart > 0 && dellen--) {
      if (/[\udc00-\udfff]/.test(s[--delstart])) delstart--;
    }
    if (delstart < 0) delstart = 0;

    rtn += `${ununesc(s.slice(0, delstart))}<del>${hesc(ununesc(s.slice(delstart, delend)))}</del><span class="invisible">${rr[0]}</span>`;
    s = s.slice(delend + rr[0].length);
  }
  return rtn + ununesc(s);
}));

// 置換をString.replace()に投げるやつ
const byre = [];

byre.push({
  order: 'pre',
  re: /((‡+|†+)([^†‡]{1,30}?))(‡+|†+)/,
  fmt: (m, skip, d1, txt, d2) => {
    if (d1[0] !== d2[0]) return null;
    return `<span class="v6don-tyu2"><span class="v6don-dagger">${d1}</span>${txt}<span class="v6don-dagger">${d2}</span></span>`;
  },
});

byre.push({
  order: 'pre',
  re: /(((?:✨[\ufe0e\ufe0f]?)+)( ?IPv6[^✨]*))((?:✨[\ufe0e\ufe0f]?)+)/u,
  fmt: (m, skip, s1, ip, s2) => {
    let f = k => k.replace(/✨/g, '<span class="v6don-kira">✨</span>');

    let ipdeco = '';
    ip = highlight(ip);
    for (let chars = 0, delay = 0; ip.length && chars < 11; chars++) {
      let deco = true, decolen;
      let rr = /^\s/u.exec(ip);
      if (rr) {
        deco = false;
        decolen = rr[0].length;
      } else if (ip[0] === '&') {
        rr = /&.*?;/.exec(ip);
        decolen = rr[0].length;
      } else if (ip[0] === '<') {
        if (/^<svg /.test(ip)) {
          deco = true;
          // BUG: SVGが入れ子になってると死ぬ
          decolen = ip.indexOf('</svg>') + '</svg>'.length;
        } else {
          deco = /^<img\s/i.test(ip);
          rr = /<[^>]*?>/.exec(ip);
          decolen = rr[0].length;
        }
      } else if (ip.codePointAt(0) >= 65536) {
        decolen = 2;
      } else {
        decolen = 1;
      }

      if (deco) {
        ipdeco += `<span class="v6don-wave" style="animation-delay: ${delay}ms">${ip.slice(0, decolen)}</span>`;
        delay += 100;
      } else {
        ipdeco += ip.slice(0, decolen);
      }
      ip = ip.slice(decolen);
    }

    if (ip.length) {
      return null;
    }

    return `${f(s1)}${ipdeco}${f(s2)}`;
  },
});

byre.push(...[
  { re: /5,?000\s?兆円/g, img: require('../../images/v6don/5000tyoen.svg'), h: 1.8 },
  { re: /5,?000兆/g, img: require('../../images/v6don/5000tyo.svg'), h: 1.8 },
  { re: /熱盛/g, img: require('../../images/v6don/atumori.png'), h: 2 },
].map(e => {
  e.fmt = (m) => `<img alt="${hesc(m)}" src="${e.img}" style="height: ${e.h}em;"/>`;
  return e;
}));

byre.push(...[
  { tag: true, re: /(<a\s[^>]*>)(.*?:don:.*?)<\/a>/mg, fmt: (all, tag, text) =>
    tag + text.replace(/:don:/g, hesc(':don:')) + '</a>',
  },
  { order: 'post', tag: true, re: /(<(?:p|br\s?\/?)>)((\(?)※.*?(\)?))<\/p>/mg, fmt: (all, br, text, po, pc) =>
    /<br\s?\/?>/.test(text) || (po && !pc || !po && pc) ? all : `${/br/.test(br) ? br : ''}<span class="v6don-kozinkanso">${text}</span></p>`,
  },
  { order: 'post', re: /[■-◿〽]/ug, fmt: c => `&#${c.codePointAt(0)};` },
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
    } else {
      rtn += str.slice(0, rr.index) + replacement;
      str = str.slice(rr.index + rr[0].length);
    }
  }
  return rtn + str;
};

byre.forEach(e => {
  trlist[e.order ? e.order : 'rec'].push(e.tag ? replace_by_re(e.re, e.fmt) : apply_without_tag(replace_by_re(e.re, e.fmt)));
});

// :tag:の置換
const shorttab = {};

// :tag: をフツーにimgで返すやつ
const shorttab_replacer_normal = match => `<img class="emojione" alt=":${match}:" title=":${match}:" src="${shorttab[match].asset}" />`;
[
  'rmn_e', 'matsu',
].forEach(name => {
  shorttab[name] = {
    asset: require(`../../images/v6don/${name}.svg`),
    replacer: shorttab_replacer_normal,
  };
});
[
  'poyo',
].forEach(name => {
  shorttab[name] = {
    asset: require(`../../images/v6don/${name}.png`),
    replacer: shorttab_replacer_normal,
  };
});

// 回転対応絵文字
[
  'nicoru', 'iine', 'irane', 'mayo',
].forEach(name => {
  shorttab[name] = {
    remtest: (rem) => /^\d+$/.test(rem),
    asset: require(`../../images/v6don/${name}.svg`),
    replacer: (match, rem) => {
      const alt = match + (rem || '');
      const style = rem ? `style="transform: rotate(${rem}deg)"` : '';
      return `<img class="emojione" alt=":${alt}:" title=":${alt}:" src="${shorttab[match].asset}" ${style}/>`;
    },
  };
});

// 不自由なロゴ達
const proprietary_image = {
  realtek: { ratio: 4.92 },
  sega: { ratio:  3.29 },
};
for (name in proprietary_image) {
  shorttab[name] = {
    replacer: name => `<img class="emojione" alt=":${name}:" title=":${name}:" src="/emoji/proprietary/${name}.svg" style="width: ${proprietary_image[name].ratio}em"/>`,
  };
}

// <object>が必要なSVG
shorttab.biwako = {
  remtest: rem => /^-[gyorpw]$/.test(rem),
  asset: require('../../images/v6don/biwako.svg'),
  replacer: (match, rem) => {
    const alt = `:biwako${rem || ''}:`;
    const path = shorttab.biwako.asset + (rem ? `#${rem[1]}` : '');
    return `<object class='emojione' data='${path}' title='${alt}'>${alt}</object>`;
  },
};

// リンク
shorttab.don = {
  replacer: () => `<a href="https://mstdn.maud.io/">${hesc(':don:')}</a>`,
};

// :tag: の単色SVG版
const monosvg_replacer = name => {
  if (shorttab[name].text) return shorttab[name].text;

  if (!shorttab[name].loading) {
    // SVGを読みに行く
    shorttab[name].loading = true;
    // 取得処理
    fetch(shorttab[name].asset).then(res => {
      let escname = hesc(name);
      if (res.ok) {
        res.text().then(txt => {
          // 読み込めた時、以後はこのSVGテキストをそのまま使う
          shorttab[name].text = txt.replace(
            /<style[\s\S]*?<\/style>/m, ''
          ).replace(
            />/, ` class="emojione v6don-monosvg"><g><title>:${escname}:</title><desc>:${escname}:</desc>`
          ).replace(/<\/svg>/, '</g></svg>').replace(/\n/mg, ' ').trim();
          // 仮置きしたspanをDOMで置換
          let dp = new DOMParser();
          let svg = dp.parseFromString(shorttab[name].text, 'application/xml').documentElement;
          let replace = (name) => {
            [].forEach.call(document.body.getElementsByClassName(`monosvg-replacee-${name}`) || [], e => {
              e.parentNode.replaceChild(svg.cloneNode(true), e);
            });
          };
          replace(name);
          // 不安なのでもう1回する(謎)
          //setTimeout(replace, 1500, name);
        });
      } else {
        // 読み込めなかった時は再取得を促す
        shorttab[name].loading = false;
      }
    });
  }
  // SVG取得まで仮置き
  return `<span class="monosvg-replacee-${name}">:${hesc(name)}:</span>`;
};
[
  'hiki', 'hohoemi', 'lab', 'tama', 'tree',
].forEach(name => {
  shorttab[name] = {
    text: null,
    loading: false,
    asset: require(`../../images/v6don/${name}.svg`),
    replacer: monosvg_replacer,
  };
});

// :tag:置換まとめ
const shorttab_trie = new Trie(Object.keys(shorttab));
trlist.rec.push(apply_without_tag(cur => {
  let prev = '';
  for (;;) {
    let tagbegin = cur.indexOf(':') + 1;
    if (!tagbegin) break;
    let tagend = cur.indexOf(':', tagbegin);
    if (tagend === -1) break;
    let tag = cur.slice(tagbegin, tagend);
    let match = shorttab_trie.search(tag);
    let replace = false, rem = null;
    if (match) {
      if (tag === match) {
        replace = true;
      } else {
        rem = tag.slice(match.length);
        replace = shorttab[match].remtest && shorttab[match].remtest(rem);
      }
    }
    if (replace) {
      prev += cur.slice(0, tagbegin - 1) + shorttab[match].replacer(match, rem);
      cur = cur.slice(tagend + 1);
    } else {
      prev += cur.slice(0, tagend);
      cur = cur.slice(tagend);
    }
  }
  return prev + cur;
}));
