export default function localQuote(text) {
  return /<blockquote(?:\s[^>]*)?>/mi.test(text) ? text : text.replace(/(<p(?:\s[^>]*)?>)(.*?)<\/p>/mg, (all, popen, cont) => {
    var qcount = (line, level) => {
      var m = qre.exec(line);
      if (m) {
        return qcount(line.slice(m[0].length), level + 1);
      }
      return level;
    }
    
    var lines = cont.split(/<br\s?\/?>/);
    var qre = /^(&gt;|＞)\s*/;
    var current = 0;
    var rtn = lines.map(line => qcount(line, 0)).map((level, idx, arr) => {
      var diff = level - current;
      var line;
      if (diff > 0) {
        var bq = ""
        while (diff--) bq += "<blockquote>";
        line = `</p>${bq}<p>${lines[idx]}`;
      }
      else if (diff == 0) {
        line = `<br/>${lines[idx]}`;
      }
      else {
        var bq = "";
        while (diff++) bq += "</blockquote>";
        line = `${bq}<p>${lines[idx]}`;
      }
      current = level;
      return line;
    }).join("");
    if (current > 0) {
        var bq = "";
        while (current--) bq += "</blockquote>";
        rtn = `${rtn}</p>${bq}<p>`;
    }
    
    var rmtopbr = text => {
      var ret = text.replace(/(<p(?:\s[^>]*)?>)\s*<br\/>/mg, "$1");
      return ret == text ? text : rmtopbr(ret);
    };
    return rmtopbr(`${popen}${rtn}</p>`).replace(/<p(?:\s[^>]*)?>\s*<\/p>/mg, "");
  });
}
