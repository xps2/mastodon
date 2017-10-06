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

  it('does multiple emoji properly (issue 5188)', () => {
    expect(emojify('👌🌈💕')).to.equal('<img draggable="false" class="emojione" alt="👌" title=":ok_hand:" src="/emoji/1f44c.svg" /><img draggable="false" class="emojione" alt="🌈" title=":rainbow:" src="/emoji/1f308.svg" /><img draggable="false" class="emojione" alt="💕" title=":two_hearts:" src="/emoji/1f495.svg" />');
    expect(emojify('👌 🌈 💕')).to.equal('<img draggable="false" class="emojione" alt="👌" title=":ok_hand:" src="/emoji/1f44c.svg" /> <img draggable="false" class="emojione" alt="🌈" title=":rainbow:" src="/emoji/1f308.svg" /> <img draggable="false" class="emojione" alt="💕" title=":two_hearts:" src="/emoji/1f495.svg" />');
  });

  it('does an emoji that has no shortcode', () => {
    expect(emojify('🕉️')).to.equal('<img draggable="false" class="emojione" alt="🕉️" title="" src="/emoji/1f549.svg" />');
  });

  it('does an emoji whose filename is irregular', () => {
    expect(emojify('↙️')).to.equal('<img draggable="false" class="emojione" alt="↙️" title=":arrow_lower_left:" src="/emoji/2199.svg" />');
  });

});
