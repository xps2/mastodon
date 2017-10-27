import React from 'react';

const pad = s => s.toString().length === 1 ? '0' + s : s;
const localtime = d => <time dateTime={d.toISOString().replace(/:\d\d\.\d+/, '')}>
  {d.getFullYear()}-{pad(d.getMonth() + 1)}-{pad(d.getDate())}
  {' ' + pad(d.getHours())}<span className='v6don-estclock-tick'>:</span>{pad(d.getMinutes())}
</time>;
const estTZ = 'Europe/Berlin';
const estFmt = {
  year: new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: estTZ }).format,
  month: new Intl.DateTimeFormat('en', { month: '2-digit', timeZone: estTZ }).format,
  date: new Intl.DateTimeFormat('en', { day: '2-digit', timeZone: estTZ }).format,
  hour: new Intl.DateTimeFormat('en', { hour: '2-digit', hour12: false, timeZone: estTZ }).format,
  minute: new Intl.DateTimeFormat('en', { minute: '2-digit', timeZone: estTZ }).format,
};
const est = d => <time dateTime={d.toISOString().replace(/:\d\d\.\d+/, '')}>
  {estFmt.year(d)}-{estFmt.month(d)}-{estFmt.date(d)}
  {' ' + pad(estFmt.hour(d))}<span className='v6don-estclock-tick'>:</span>{pad(estFmt.minute(d))}
</time>;

export default class ESTClock extends React.Component {

  componentDidMount() {
    this.prevTick = -Infinity;
    this.fid = requestAnimationFrame(this.tick.call(this));
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.fid);
  }

  tick() {
    return () => {
      const tickTest = Math.floor(Date.now() / 500);
      if (tickTest > this.prevTick) {
        this.setState({});
        this.prevTick = tickTest;
      }
      this.fid = requestAnimationFrame(this.tick.call(this));
    };
  }

  render() {
    const cur = new Date();
    return (<div className='v6don-estclock' data-tick={cur.getMilliseconds() >= 500 ? 'hidden' : 'visible'}><table><tbody>
      <tr><th>Local:</th><td>{localtime(cur)}</td></tr>
      <tr><th>Germany:</th><td>{est(cur)}</td></tr>
    </tbody></table></div>);
  }

}
