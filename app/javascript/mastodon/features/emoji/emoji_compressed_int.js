module.exports = JSON.parse(JSON.stringify(require('./emoji_compressed')).replace(/[\u0100-\u0fff]/g, c => String.fromCodePoint(c.charCodeAt(0) + 0x1f000)));
