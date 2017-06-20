export default function localQuote(text) { 
  return text.replace(/<p>(.*?)<\/p>/mg, (all, cont) => {
    var rec = (line, level) => {
      var m = qre.exec(line);
      if (m) {
        return rec(line.slice(m[0].length), level + 1);
      }
      return level;
    }
    
    var lines = cont.split(/<br\s?\/?>/);
    var qre = /^(&gt;|＞)\s*/;
    var current = 0;
    var rtn = lines.map(line => rec(line, 0)).map((level, idx, arr) => {
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
    return `<p>${rtn}</p>`.replace(/<p><br\/>/g, "<p>").replace(/<p>\s*<\/p>/g, "");
  });
}
