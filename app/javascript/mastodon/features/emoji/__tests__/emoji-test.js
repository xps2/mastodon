import emojify from '../emoji';

describe('emoji', () => {
  describe('.emojify', () => {
    it('ignores unknown shortcodes', () => {
      expect(emojify(':foobarbazfake:')).toEqual(':foobarbazfake:');
    });

    it('ignores shortcodes inside of tags', () => {
      expect(emojify('<p data-foo=":smile:"></p>')).toEqual('<p data-foo=":smile:"></p>');
    });

    it('works with unclosed tags', () => {
      expect(emojify('hello>')).toEqual('hello>');
      expect(emojify('<hello')).toEqual('<hello');
    });

    it('works with unclosed shortcodes', () => {
      expect(emojify('smile:')).toEqual('smile:');
      expect(emojify(':smile')).toEqual(':smile');
    });

    it('avoid emojifying on invisible text', () => {
      expect(emojify('<a href="http://example.com/test%F0%9F%98%84"><span class="invisible">http://</span><span class="ellipsis">example.com/te</span><span class="invisible">st😄</span></a>'))
        .toEqual('<a href="http://example.com/test%F0%9F%98%84"><span class="invisible">http://</span><span class="ellipsis">example.com/te</span><span class="invisible">st😄</span></a>');
      expect(emojify('<span class="invisible">:luigi:</span>', { ':luigi:': { static_url: 'luigi.exe' } }))
        .toEqual('<span class="invisible">:luigi:</span>');
    });

  });
});
