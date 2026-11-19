// When a job starts and when it ends: her own dates first (startsOn, endsOn), then what the scheduled
// search saved from the advert (jobStart, jobEnd and their words), otherwise what the
// advert says in so many words. Only a real date next to a start or end word counts ("Start date:
// September 2027", "commencing 1 October 2026", "until 31 March 2027", "Summer 2027 internship",
// "12-week placement"), so boilerplate like "check the start date" or "until filled" is ignored.
// A month or a season is read as its first day and marked approximate.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const SEASONS = { spring: 3, summer: 6, autumn: 9, fall: 9, winter: 12 };
const DATE = `(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH}\\s+(20\\d\\d)|${MONTH}\\s+(20\\d\\d)|(spring|summer|autumn|fall|winter)\\s+(20\\d\\d)|(\\d{1,2})/(\\d{1,2})/(20\\d\\d)|(20\\d\\d)-(\\d\\d)-(\\d\\d))`;
const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

// The date in a regular-expression match of DATE, starting at group `g`: { date, approx }.
function dateFrom(m, g) {
  if (m[g + 2]) return { date: iso(m[g + 2], MONTHS.indexOf(m[g + 1].slice(0, 3).toLowerCase()) + 1, Number(m[g])), approx: false };
  if (m[g + 4]) return { date: iso(m[g + 4], MONTHS.indexOf(m[g + 3].slice(0, 3).toLowerCase()) + 1, 1), approx: true };
  if (m[g + 6]) return { date: iso(m[g + 6], SEASONS[m[g + 5].toLowerCase()], 1), approx: true };
  if (m[g + 9]) return { date: iso(m[g + 9], Number(m[g + 8]), Number(m[g + 7])), approx: false };
  if (m[g + 10]) return { date: `${m[g + 10]}-${m[g + 11]}-${m[g + 12]}`, approx: false };
  return null;
}
const valid = (d) => d && !Number.isNaN(Date.parse(d.date + 'T12:00:00Z')) && Number(d.date.slice(5, 7)) >= 1 && Number(d.date.slice(5, 7)) <= 12;

const START = new RegExp(`(?:\\bstart(?:s|ing)?(?:\\s+date)?|\\bcommenc(?:e|es|ing|ement)(?:\\s+date)?|\\bbegin(?:s|ning)?|\\bjoin(?:ing)?\\s+us)\\s*(?:on|in|from|is|:|-|–)?\\s*(?:the\\s+)?(?:early|mid|late|beginning\\s+of|end\\s+of)?\\s*(?:-\\s*)?${DATE}`, 'i');
const START_AFTER = new RegExp(`${DATE}\\s+(?:start|intake|entry|cohort)\\b`, 'i');
const SEASON_ROLE = /\b(summer|spring|autumn)\s+(20\d\d)\b[^\n]{0,40}\b(internship|placement|programme|program|analyst|scheme)|\b(20\d\d)\s+(summer|spring|autumn)\s+(internship|placement|programme|analyst)/i;
const ASAP = /\b(?:start|join|begin)\w*[^.\n]{0,20}\b(?:asap|as soon as possible|immediately)\b|\bimmediate start\b|\bavailable to start immediately\b/i;
const END = new RegExp(`(?:\\bend(?:s|ing)?(?:\\s+date)?|\\buntil|\\bfinish(?:es|ing)?|\\bfixed[- ]term(?:\\s+contract)?\\s+(?:to|until|ending))\\s*(?:on|in|:|-|–)?\\s*(?:the\\s+)?(?:end\\s+of\\s+)?${DATE}`, 'i');
const LENGTH = /\b(\d{1,2})[- ]?(week|month)s?(?:'s)?\s+(?:paid\s+|full[- ]time\s+|part[- ]time\s+)?(?:placement|internship|contract|fixed[- ]term|programme|program|secondment)|\b(?:fixed[- ]term|contract|placement|internship|secondment)\s+(?:of|for|lasting)\s+(\d{1,2})\s+(week|month)s?/i;
const PERMANENT = /\bpermanent\b/i;

const textOf = (job) => [job.role, job.employment, job.hours, job.description, ...Object.entries(job.fields || {}).map(([k, v]) => `${k}: ${v}`)].filter(Boolean).join('\n');
const addWeeks = (date, weeks) => new Date(Date.parse(date + 'T12:00:00Z') + weeks * 7 * 86400000).toISOString().slice(0, 10);
const addMonths = (date, months) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + months); return d.toISOString().slice(0, 10); };

// A saved date on the first of a month whose words name no day ("September 2027") is approximate.
const roughly = (date, words = '') => date.endsWith('-01') && !/\b\d{1,2}(?:st|nd|rd|th)?\s+[a-z]/i.test(words || '');
// { start: { date, approx, asap, source, words }, end: { date, approx, permanent, weeks, source, words } }
export function jobPeriod(job) {
  const text = textOf(job);
  const start = { date: '', approx: false, asap: false, source: '', words: '' };
  const end = { date: '', approx: false, permanent: false, weeks: 0, source: '', words: '' };
  if (job.startsOn) Object.assign(start, { date: job.startsOn, source: 'mine' });
  else if (job.jobStart) Object.assign(start, { date: job.jobStart, approx: roughly(job.jobStart, job.jobStartText), source: 'search', words: (job.jobStartText || '').slice(0, 80) });
  else if (job.jobStartText && ASAP.test('start ' + job.jobStartText)) Object.assign(start, { asap: true, source: 'search', words: job.jobStartText.slice(0, 80) });
  else {
    let m = text.match(START), found = m && dateFrom(m, 1);
    if (!valid(found)) { m = text.match(START_AFTER); found = m && dateFrom(m, 1); }
    if (valid(found)) Object.assign(start, found, { source: 'advert', words: m[0].trim().slice(0, 80) });
    else if ((m = text.match(SEASON_ROLE))) {
      const season = (m[1] || m[5]).toLowerCase(), year = m[2] || m[4];
      Object.assign(start, { date: iso(year, SEASONS[season], 1), approx: true, source: 'advert', words: m[0].trim().slice(0, 80) });
    } else if ((m = text.match(ASAP))) Object.assign(start, { asap: true, source: 'advert', words: m[0].trim().slice(0, 80) });
  }
  const length = text.match(LENGTH);
  if (length) end.weeks = (length[1] ? (length[2].toLowerCase() === 'week' ? Number(length[1]) : Number(length[1]) * 4.345) : (length[4].toLowerCase() === 'week' ? Number(length[3]) : Number(length[3]) * 4.345));
  end.weeks = Math.round(end.weeks);
  if (job.endsOn) Object.assign(end, { date: job.endsOn, source: 'mine' });
  else if (job.jobEnd) Object.assign(end, { date: job.jobEnd, approx: roughly(job.jobEnd, job.jobEndText), source: 'search', words: (job.jobEndText || '').slice(0, 80) });
  else {
    const m = text.match(END), found = m && dateFrom(m, 1);
    if (valid(found) && (!start.date || found.date >= start.date)) Object.assign(end, found, { source: 'advert', words: m[0].trim().slice(0, 80) });
    else if (length && start.date) {
      const date = length[2]?.toLowerCase() === 'week' || length[4]?.toLowerCase() === 'week' ? addWeeks(start.date, end.weeks) : addMonths(start.date, Number(length[1] || length[3]));
      Object.assign(end, { date, approx: true, source: 'advert', words: length[0].trim().slice(0, 80) });
    }
  }
  if (!end.date && !end.weeks && (PERMANENT.test(text) || PERMANENT.test(job.jobEndText || ''))) end.permanent = true;
  return { start, end };
}

// The next 1 September after today (the start of the next academic year), and the next summer.
export function nextSeptember(today) { const y = Number(today.slice(0, 4)); return today < `${y}-09-01` ? `${y}-09-01` : `${y + 1}-09-01`; }
export function nextSummer(today) { const y = Number(today.slice(0, 4)); const year = today <= `${y}-06-01` ? y : y + 1; return [`${year}-06-01`, `${year}-08-31`]; }
const monthYear = (date) => new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export function startFilters(today) {
  const sep = nextSeptember(today), [summer] = nextSummer(today);
  return [['', 'Any start date'], ['asap', 'Starts now or as soon as possible'], ['3m', 'Starts within 3 months'], ['summer', `Starts in summer ${summer.slice(0, 4)}`], ['after-sep', `Starts ${monthYear(sep)} or later`], ['none', 'Start date not stated']];
}
export function endFilters(today) {
  const sep = nextSeptember(today);
  return [['', 'Any end date'], ['permanent', 'Permanent'], ['fixed', 'Fixed term or placement'], ['before-sep', `Ends before ${monthYear(sep)}`], ['short', 'Six months or shorter'], ['none', 'End not stated']];
}
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);
export function startMatch(job, filter, today) {
  if (!filter) return true;
  const { start } = jobPeriod(job);
  if (filter === 'none') return !start.date && !start.asap;
  if (filter === 'asap') return start.asap || (!!start.date && daysBetween(today, start.date) <= 31);
  if (!start.date) return false;
  if (filter === '3m') return daysBetween(today, start.date) <= 92;
  if (filter === 'summer') { const [from, to] = nextSummer(today); return start.date >= from && start.date <= to; }
  if (filter === 'after-sep') return start.date >= nextSeptember(today);
  return true;
}
export function endMatch(job, filter, today) {
  if (!filter) return true;
  const { start, end } = jobPeriod(job);
  if (filter === 'permanent') return end.permanent;
  if (filter === 'fixed') return !!end.date || end.weeks > 0;
  if (filter === 'before-sep') return !!end.date && end.date < nextSeptember(today);
  if (filter === 'short') return (end.weeks > 0 && end.weeks <= 26) || (!!end.date && !!start.date && daysBetween(start.date, end.date) <= 183);
  if (filter === 'none') return !end.date && !end.weeks && !end.permanent;
  return true;
}
