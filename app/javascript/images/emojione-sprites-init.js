import sprites from './emojione.sprites.svg';

// if assets are distributed at another server, <use> with direct asset path doesn't work
// so fetch as XML and add into <head> to work as template
if (/^(https?:)?\/\//.test(sprites)) {
  (function loadSprites(retry) {
    fetch(sprites).then(res => {
      if (res.ok) {
        return res.text();
      }
      throw new Error('response error!?');
    }).then(txt => {
      document.head.appendChild(new DOMParser().parseFromString(txt, 'text/xml').documentElement);
    }).catch(() => {
      if (retry) {
        setTimeout(loadSprites, 500, --retry);
      }
    });
  })(5);
}
