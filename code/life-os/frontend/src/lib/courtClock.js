import { CALENDAR_TIME_ZONE } from '../../../shared/calendar.js'

export function greetingFor(date) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: CALENDAR_TIME_ZONE, hour: '2-digit', hourCycle: 'h23'
  }).format(date))

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function dateLabelFor(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: CALENDAR_TIME_ZONE,
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(date).replace(',', ' ·')
}

export function shortDateLabelFor(date) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: CALENDAR_TIME_ZONE, day: 'numeric', month: 'short'
  }).format(date)
}

export function clockLabelFor(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: CALENDAR_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date)
}

export function jalaliDateLabelFor(date) {
  try {
    return new Intl.DateTimeFormat('en-GB-u-ca-persian', {
      timeZone: CALENDAR_TIME_ZONE, year: 'numeric', month: 'short', day: 'numeric'
    }).format(date).replace(/\s+AP$/i, '')
  } catch {
    return ''
  }
}

export function weekdayLabelFor(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: CALENDAR_TIME_ZONE, weekday: 'long'
  }).format(date)
}
