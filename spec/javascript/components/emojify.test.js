import { expect } from 'chai';
import emojify from '../../../app/javascript/mastodon/features/emoji/emoji';

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

  it('ignores unicode inside of tags', () => {
    expect(emojify('<p data-foo="\uD83D\uDC69\uD83D\uDC69\uD83D\uDC66"></p>')).to.equal('<p data-foo="\uD83D\uDC69\uD83D\uDC69\uD83D\uDC66"></p>');
  });

});
