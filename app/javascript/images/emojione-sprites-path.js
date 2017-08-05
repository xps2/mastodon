import sprites from './emojione.sprites.svg';
const usePath = /^(https?:)?\/\//.test(sprites) ? '' : sprites;
export default usePath;
