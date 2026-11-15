import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  Timestamp,
  type Duration,
  type TimestampFormat,
  type TimestampMoment,
  type TimestampUnit,
} from '../../src/index.js';

describe('Timestamp utility', () => {
  it('constructs from a valid CGT moment', () => {
    const ts = new Timestamp({ year: 25, day: 60, hour: 12, minute: 34, second: 56 });

    expect(ts.asMoment()).toEqual({
      year: 25,
      day: 60,
      hour: 12,
      minute: 34,
      second: 56,
    });
  });

  it('throws RangeError for invalid moment ranges', () => {
    expect(() => new Timestamp({ year: -1, day: 1 })).toThrow(RangeError);
    expect(() => new Timestamp({ year: 1, day: 0 })).toThrow(RangeError);
    expect(() => new Timestamp({ year: 1, day: 366 })).toThrow(RangeError);
    expect(() => new Timestamp({ year: 1, day: 1, hour: 24 })).toThrow(RangeError);
    expect(() => new Timestamp({ year: 1, day: 1, minute: 60 })).toThrow(RangeError);
    expect(() => new Timestamp({ year: 1, day: 1, second: 60 })).toThrow(RangeError);
  });

  it('throws RangeError for pre-SWC unix timestamps and dates', () => {
    const swcStartSec = Date.UTC(1998, 11, 3, 7, 0, 0) / 1000;

    expect(() => Timestamp.fromUnixTimestamp(swcStartSec - 1)).toThrow(RangeError);
    expect(() => Timestamp.fromDate(new Date(Date.UTC(1998, 11, 3, 6, 59, 59)))).toThrow(
      RangeError
    );
  });

  it('auto-detects unix seconds vs milliseconds', () => {
    const unixSec = 1735920000;
    const fromSeconds = Timestamp.fromUnixTimestamp(unixSec);
    const fromMilliseconds = Timestamp.fromUnixTimestamp(unixSec * 1000);

    expect(fromSeconds.asMoment()).toEqual(fromMilliseconds.asMoment());
  });

  it('round-trips Date and unix timestamp units', () => {
    const date = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
    const ts = Timestamp.fromDate(date);

    expect(ts.toDate().toISOString()).toBe(date.toISOString());
    expect(ts.toUnixTimestamp('sec')).toBe(1735689600);
    expect(ts.toUnixTimestamp('seconds')).toBe(1735689600);
    expect(ts.toUnixTimestamp('ms')).toBe(1735689600000);
    expect(ts.toUnixTimestamp('milliseconds')).toBe(1735689600000);
  });

  it('adds and subtracts durations, clamping subtraction at SWC start', () => {
    const start = new Timestamp({ year: 0, day: 1, hour: 0, minute: 0, second: 0 });
    const added = start.add({ days: 1, hours: 2, minutes: 3, seconds: 4 });
    const clamped = start.subtract({ years: 10 });

    expect(added.asMoment()).toEqual({
      year: 0,
      day: 2,
      hour: 2,
      minute: 3,
      second: 4,
    });
    expect(clamped.asMoment()).toEqual({
      year: 0,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
    });
  });

  it('throws RangeError for invalid duration values', () => {
    const ts = new Timestamp({ year: 1, day: 1 });

    expect(() => ts.add({ days: -1 })).toThrow(RangeError);
    expect(() => ts.subtract({ hours: 1.5 })).toThrow(RangeError);
  });

  it('returns signed normalized duration values', () => {
    const start = Timestamp.fromUnixTimestamp(1735920000);
    const end = start.add({ days: 1, hours: 2, minutes: 3, seconds: 4 });

    expect(start.getDurationTo(end)).toEqual({
      years: 0,
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
    });
    expect(end.getDurationTo(start)).toEqual({
      years: 0,
      days: -1,
      hours: -2,
      minutes: -3,
      seconds: -4,
    });
  });

  it('formats with presets and custom tags', () => {
    const ts = new Timestamp({ year: 25, day: 6, hour: 8, minute: 12, second: 14 });

    expect(ts.toString('full')).toBe('Year 25 Day 6, 8:12:14');
    expect(ts.toString('minute')).toBe('Year 25 Day 6, 8:12');
    expect(ts.toString('day')).toBe('Year 25 Day 6');
    expect(ts.toString('shortFull')).toBe('Y25 D6, 8:12:14');
    expect(ts.toString('shortMinute')).toBe('Y25 D6, 8:12');
    expect(ts.toString('shortDay')).toBe('Y25 D6');

    expect(ts.toString('{hms} on Day {d} of Year {y}')).toBe('08:12:14 on Day 6 of Year 25');
    expect(ts.toString('{yy}-{dd} {hh}:{mm}:{ss}')).toBe('25-06 08:12:14');
  });

  it('exports timestamp types from package entrypoint', () => {
    const moment: TimestampMoment = { year: 2, day: 10 };
    const duration: Duration = { years: 0, days: 1, hours: 2, minutes: 3, seconds: 4 };
    const format: TimestampFormat = 'full';
    const unit: TimestampUnit = 'seconds';

    expectTypeOf(moment).toMatchTypeOf<TimestampMoment>();
    expectTypeOf(duration).toMatchTypeOf<Duration>();
    expectTypeOf(format).toMatchTypeOf<TimestampFormat>();
    expectTypeOf(unit).toMatchTypeOf<TimestampUnit>();
  });
});
