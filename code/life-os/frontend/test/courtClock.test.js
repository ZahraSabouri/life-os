import test from 'node:test'
import assert from 'node:assert/strict'
import { clockLabelFor, dateLabelFor, greetingFor, jalaliDateLabelFor, shortDateLabelFor, weekdayLabelFor } from '../src/lib/courtClock.js'

test('Court dates and clock agree with the London day across device timezones', () => {
  const previousZone = process.env.TZ
  try {
    const instant = new Date('2026-10-04T23:30:00Z')
    const readLabels = () => [dateLabelFor(instant), shortDateLabelFor(instant), clockLabelFor(instant), jalaliDateLabelFor(instant), weekdayLabelFor(instant), greetingFor(instant)]
    process.env.TZ = 'Europe/London'
    const londonLabels = readLabels()
    assert.equal(londonLabels[0], 'Monday · 5 October 2026')
    assert.equal(londonLabels[2], '00:30')
    assert.equal(londonLabels[4], 'Monday')
    assert.equal(londonLabels[5], 'Good morning')
    assert.match(londonLabels[3], /13 Mehr 1405/)
    for (const deviceZone of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo']) {
      process.env.TZ = deviceZone
      assert.deepEqual(readLabels(), londonLabels, deviceZone)
    }
  } finally {
    if (previousZone === undefined) delete process.env.TZ
    else process.env.TZ = previousZone
  }
})

test('Court greeting and clock follow London daylight saving at noon and evening', () => {
  assert.equal(clockLabelFor(new Date('2026-10-24T11:00:00Z')), '12:00')
  assert.equal(greetingFor(new Date('2026-10-24T11:00:00Z')), 'Good afternoon')
  assert.equal(greetingFor(new Date('2026-10-24T17:00:00Z')), 'Good evening')
  assert.equal(clockLabelFor(new Date('2026-10-25T11:00:00Z')), '11:00')
  assert.equal(greetingFor(new Date('2026-10-25T11:00:00Z')), 'Good morning')
  assert.equal(greetingFor(new Date('2026-10-25T17:00:00Z')), 'Good afternoon')
})
