import { expect } from 'chai';
import emojify from '../../../app/javascript/mastodon/emoji';

describe('emojify', () => {
  it('ignores unknown shortcodes', () => {
    expect(emojify(':foobarbazfake:')).to.equal(':foobarbazfake:');
  });

  it('ignores shortcodes inside of tags', () => {
    expect(emojify('<p data-foo=":smile:"></p>')).to.equal('<p data-foo=":smile:"></p>');
  });

  it('works with unclosed tags', () => {
    expect(emojify('hello>')).to.equal('hello>');
    expect(emojify('<hello')).to.equal('<hello');
  });

  it('works with unclosed shortcodes', () => {
    expect(emojify('smile:')).to.equal('smile:');
    expect(emojify(':smile')).to.equal(':smile');
  });

  const svgintro = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="emojione" viewBox="0 0 1 1"><g><title>';
  it('does unicode', () => {
    expect(emojify('\uD83D\uDC69\u200D\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66')).to.equal(
      `${svgintro}:family_wwbb:</title><desc>👩‍👩‍👦‍👦</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-1f469-1f469-1f466-1f466"/></g></svg>`);
    expect(emojify('\uD83D\uDC68\uD83D\uDC69\uD83D\uDC67\uD83D\uDC67')).to.equal(
      `${svgintro}:family_mwgg:</title><desc>👨👩👧👧</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-1f468-1f469-1f467-1f467"/></g></svg>`);
    expect(emojify('\uD83D\uDC69\uD83D\uDC69\uD83D\uDC66')).to.equal(`${svgintro}:family_wwb:</title><desc>👩👩👦</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-1f469-1f469-1f466"/></g></svg>`);
    expect(emojify('\u2757')).to.equal(
      `${svgintro}:exclamation:</title><desc>❗</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-2757"/></g></svg>`);
  });

  it('does multiple unicode', () => {
    expect(emojify('\u2757 #\uFE0F\u20E3')).to.equal(
      `${svgintro}:exclamation:</title><desc>❗</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-2757"/></g></svg> ${svgintro}:hash:</title><desc>#️⃣</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-0023-20e3"/></g></svg>`);
    expect(emojify('\u2757#\uFE0F\u20E3')).to.equal(
      `${svgintro}:exclamation:</title><desc>❗</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-2757"/></g></svg>${svgintro}:hash:</title><desc>#️⃣</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-0023-20e3"/></g></svg>`);
    expect(emojify('\u2757 #\uFE0F\u20E3 \u2757')).to.equal(
      `${svgintro}:exclamation:</title><desc>❗</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-2757"/></g></svg> ${svgintro}:hash:</title><desc>#️⃣</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-0023-20e3"/></g></svg> ${svgintro}:exclamation:</title><desc>❗</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-2757"/></g></svg>`);
    expect(emojify('foo \u2757 #\uFE0F\u20E3 bar')).to.equal(
      `foo ${svgintro}:exclamation:</title><desc>❗</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-2757"/></g></svg> ${svgintro}:hash:</title><desc>#️⃣</desc><use xlink:href="/packs/emojione.sprites.svg#emoji-0023-20e3"/></g></svg> bar`);
  });

  it('ignores unicode inside of tags', () => {
    expect(emojify('<p data-foo="\uD83D\uDC69\uD83D\uDC69\uD83D\uDC66"></p>')).to.equal('<p data-foo="\uD83D\uDC69\uD83D\uDC69\uD83D\uDC66"></p>');
  });
});
