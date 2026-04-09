/**
 * Timestamp utility for working with Star Wars Combine Combine Galactic Time (CGT)
 */

import type { TimestampMoment, Duration, TimestampFormat, TimestampUnit } from './types/index.js';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;

const MS_PER_MINUTE = SECONDS_PER_MINUTE * MS_PER_SECOND;
const MS_PER_HOUR = MINUTES_PER_HOUR * MS_PER_MINUTE;
const MS_PER_DAY = HOURS_PER_DAY * MS_PER_HOUR;
const MS_PER_YEAR = DAYS_PER_YEAR * MS_PER_DAY;

const SEC_PER_MINUTE = SECONDS_PER_MINUTE;
const SEC_PER_HOUR = MINUTES_PER_HOUR * SEC_PER_MINUTE;
const SEC_PER_DAY = HOURS_PER_DAY * SEC_PER_HOUR;
const SEC_PER_YEAR = DAYS_PER_YEAR * SEC_PER_DAY;

/**
 * Utility class for working with Star Wars Combine timestamps.
 * Represents Combine Galactic Time and can convert unix timestamps
 * and Date objects to/from CGT.
 */
export class Timestamp {
  /**
   * SWC start date (December 3, 1998 at 07:00:00 UTC)
   */
  private static readonly swcStart = new Date(Date.UTC(1998, 11, 3, 7, 0, 0));
  private static readonly swcStartMs = Timestamp.swcStart.getTime();
  private static readonly swcStartSeconds = Timestamp.swcStartMs / MS_PER_SECOND;

  protected year: number;
  protected day: number;
  protected hour: number;
  protected minute: number;
  protected second: number;

  /**
   * Create a new Timestamp object for a specific moment in Combine Galactic Time
   *
   * @param source - Moment in CGT (year, day, and optionally hour, minute, second)
   */
  constructor(source: TimestampMoment) {
    const { year, day, hour = 0, minute = 0, second = 0 } = source;
    Timestamp.validateMoment({ year, day, hour, minute, second });

    this.year = year;
    this.day = day;
    this.hour = hour;
    this.minute = minute;
    this.second = second;
  }

  /**
   * Convert a unix timestamp to Combine Galactic Time
   *
   * @param unixTimestamp - Unix timestamp (seconds or milliseconds, auto-detected)
   * @returns Timestamp instance representing the CGT moment
   */
  static fromUnixTimestamp(unixTimestamp: number): Timestamp {
    if (!Number.isFinite(unixTimestamp)) {
      throw new RangeError('unixTimestamp must be a finite number.');
    }

    // Auto-detect seconds vs milliseconds
    const timestampMs =
      unixTimestamp < 100000000000
        ? Math.floor(unixTimestamp * MS_PER_SECOND)
        : Math.floor(unixTimestamp);

    if (timestampMs < this.swcStartMs) {
      throw new RangeError('unixTimestamp must not be before SWC start.');
    }

    return this.calculateTimestampFromMillisecondsSinceStart(timestampMs - this.swcStartMs);
  }

  /**
   * Convert a Date object into Combine Galactic Time
   *
   * @param date - JavaScript Date object
   * @returns Timestamp instance representing the CGT moment
   */
  static fromDate(date: Date): Timestamp {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new RangeError('date must be a valid Date.');
    }

    if (date.getTime() < this.swcStartMs) {
      throw new RangeError('date must not be before SWC start.');
    }

    return this.calculateTimestampFromMillisecondsSinceStart(date.getTime() - this.swcStartMs);
  }

  /**
   * Get the current Combine Galactic Time
   *
   * @returns Timestamp instance representing the current CGT moment
   */
  static now(): Timestamp {
    return Timestamp.fromDate(new Date());
  }

  /**
   * Calculate CGT from milliseconds since SWC start
   *
   * @param msSinceSwcStart - Milliseconds since SWC start date
   * @returns Timestamp instance
   */
  private static calculateTimestampFromMillisecondsSinceStart(msSinceSwcStart: number): Timestamp {
    if (!Number.isFinite(msSinceSwcStart) || msSinceSwcStart < 0) {
      throw new RangeError('msSinceSwcStart must be a non-negative finite number.');
    }

    let remaining = Math.floor(msSinceSwcStart);

    const year = Math.floor(remaining / MS_PER_YEAR);
    remaining -= year * MS_PER_YEAR;

    const day = Math.floor(remaining / MS_PER_DAY);
    remaining -= day * MS_PER_DAY;

    const hour = Math.floor(remaining / MS_PER_HOUR);
    remaining -= hour * MS_PER_HOUR;

    const minute = Math.floor(remaining / MS_PER_MINUTE);
    remaining -= minute * MS_PER_MINUTE;

    const second = Math.floor(remaining / MS_PER_SECOND);

    return new Timestamp({
      year,
      day: day + 1, // Days are 1-indexed
      hour,
      minute,
      second,
    });
  }

  /**
   * Convert the CGT timestamp into a unix timestamp
   *
   * @param unit - Output unit (seconds or milliseconds)
   * @returns Unix timestamp
   */
  toUnixTimestamp(unit: TimestampUnit): number {
    const raw = this.calculateMillisecondsSinceStartFromTimestamp() + Timestamp.swcStartMs;

    if (unit === 'sec' || unit === 'seconds') {
      return raw / MS_PER_SECOND;
    }
    if (unit === 'ms' || unit === 'milliseconds') {
      return raw;
    }

    throw new RangeError('unit must be one of: sec, ms, seconds, milliseconds.');
  }

  /**
   * Convert the CGT timestamp into a Date object
   *
   * @returns JavaScript Date object
   */
  toDate(): Date {
    return new Date(this.calculateMillisecondsSinceStartFromTimestamp() + Timestamp.swcStartMs);
  }

  /**
   * Get the timestamp as a TimestampMoment object
   *
   * @returns TimestampMoment representation
   */
  asMoment(): TimestampMoment {
    return {
      year: this.year,
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      second: this.second,
    };
  }

  /**
   * Get the year component
   *
   * @returns Year in CGT
   */
  getYear(): number {
    return this.year;
  }

  /**
   * Get the day component
   *
   * @returns Day of the year (1-365)
   */
  getDay(): number {
    return this.day;
  }

  /**
   * Get the hour component
   *
   * @returns Hour of the day (0-23)
   */
  getHour(): number {
    return this.hour;
  }

  /**
   * Get the minute component
   *
   * @returns Minute of the hour (0-59)
   */
  getMinute(): number {
    return this.minute;
  }

  /**
   * Get the second component
   *
   * @returns Second of the minute (0-59)
   */
  getSecond(): number {
    return this.second;
  }

  /**
   * Calculate a new timestamp by adding time to this timestamp
   *
   * @param duration - Duration to add (partial duration allowed)
   * @returns New Timestamp with added duration
   */
  add(duration: Partial<Duration>): Timestamp {
    const unixTime = this.toUnixTimestamp('sec');
    return Timestamp.fromUnixTimestamp(unixTime + durationToSeconds(duration));
  }

  /**
   * Calculate a new timestamp by subtracting time from this timestamp
   *
   * @param duration - Duration to subtract (partial duration allowed)
   * @returns New Timestamp with subtracted duration (won't go before SWC start)
   */
  subtract(duration: Partial<Duration>): Timestamp {
    const unixTime = this.toUnixTimestamp('sec');
    return Timestamp.fromUnixTimestamp(
      Math.max(unixTime - durationToSeconds(duration), Timestamp.swcStartSeconds)
    );
  }

  /**
   * Calculate the duration from this timestamp to another timestamp
   *
   * @param otherTimestamp - Target timestamp
   * @returns Duration between timestamps (positive if other is in future)
   */
  getDurationTo(otherTimestamp: Timestamp): Duration {
    if (!(otherTimestamp instanceof Timestamp)) {
      throw new RangeError('otherTimestamp must be a Timestamp.');
    }

    const startTime = this.toUnixTimestamp('sec');
    const endTime = otherTimestamp.toUnixTimestamp('sec');
    return secondsToDuration(endTime - startTime);
  }

  /**
   * Convert the CGT timestamp to a string
   *
   * You can either pass in a preset name, or a custom format string.
   *
   * **Preset formats:**
   * - `'full'`: Year 25 Day 60, 6:03:12
   * - `'minute'`: Year 25 Day 60, 6:03
   * - `'day'`: Year 25 Day 60
   * - `'shortFull'`: Y25 D60, 6:03:12
   * - `'shortMinute'`: Y25 D60, 6:03
   * - `'shortDay'`: Y26 D60
   *
   * **Custom format tags:**
   * - `{y}`: year
   * - `{d}`: day
   * - `{h}`: hour
   * - `{m}`: minute
   * - `{s}`: second
   * - Double the tag for leading zeroes (e.g., `{hh}` = 08)
   * - `{hms}`: shorthand for `{hh}:{mm}:{ss}`
   *
   * @param format - Preset format name or custom format string
   * @returns Formatted timestamp string
   */
  toString(format: TimestampFormat | string = 'full'): string {
    // Handle preset formats
    switch (format) {
      case 'full':
        return `Year ${this.year} Day ${this.day}, ${this.hour}:${this.minute
          .toString()
          .padStart(2, '0')}:${this.second.toString().padStart(2, '0')}`;
      case 'minute':
        return `Year ${this.year} Day ${this.day}, ${this.hour}:${this.minute.toString().padStart(2, '0')}`;
      case 'day':
        return `Year ${this.year} Day ${this.day}`;
      case 'shortFull':
        return `Y${this.year} D${this.day}, ${this.hour}:${this.minute
          .toString()
          .padStart(2, '0')}:${this.second.toString().padStart(2, '0')}`;
      case 'shortMinute':
        return `Y${this.year} D${this.day}, ${this.hour}:${this.minute.toString().padStart(2, '0')}`;
      case 'shortDay':
        return `Y${this.year} D${this.day}`;
      default:
        break;
    }

    // Handle custom format strings
    let formattedString = '';
    let currentTag = '';
    let isInTag = false;

    for (const char of format.split('')) {
      if (char === '{' && !isInTag) {
        isInTag = true;
        continue;
      }
      if (char === '}' && isInTag) {
        formattedString += this.substituteTag(currentTag);
        isInTag = false;
        currentTag = '';
        continue;
      }

      if (isInTag) {
        currentTag += char;
      } else {
        formattedString += char;
      }
    }

    return formattedString;
  }

  /**
   * Substitute a format tag with its value
   *
   * @param tag - Format tag (e.g., "y", "yy", "hms")
   * @returns Substituted value
   */
  private substituteTag(tag: string): string {
    switch (tag.toLowerCase()) {
      case 'y':
        return this.year.toString();
      case 'yy':
        return this.year.toString().padStart(2, '0');
      case 'd':
        return this.day.toString();
      case 'dd':
        return this.day.toString().padStart(2, '0');
      case 'h':
        return this.hour.toString();
      case 'hh':
        return this.hour.toString().padStart(2, '0');
      case 'm':
        return this.minute.toString();
      case 'mm':
        return this.minute.toString().padStart(2, '0');
      case 's':
        return this.second.toString();
      case 'ss':
        return this.second.toString().padStart(2, '0');
      case 'hms':
        return `${this.hour.toString().padStart(2, '0')}:${this.minute
          .toString()
          .padStart(2, '0')}:${this.second.toString().padStart(2, '0')}`;
      default:
        return '';
    }
  }

  /**
   * Calculate milliseconds since SWC start from this timestamp
   *
   * @returns Milliseconds since SWC start date
   */
  private calculateMillisecondsSinceStartFromTimestamp(): number {
    let msSinceSwcStart = 0;

    msSinceSwcStart += this.year * MS_PER_YEAR;
    msSinceSwcStart += (this.day - 1) * MS_PER_DAY; // Days are 1-indexed
    msSinceSwcStart += this.hour * MS_PER_HOUR;
    msSinceSwcStart += this.minute * MS_PER_MINUTE;
    msSinceSwcStart += this.second * MS_PER_SECOND;

    return msSinceSwcStart;
  }

  private static validateMoment(moment: Required<TimestampMoment>): void {
    if (!Number.isInteger(moment.year) || moment.year < 0) {
      throw new RangeError('year must be a non-negative integer.');
    }
    if (!Number.isInteger(moment.day) || moment.day < 1 || moment.day > DAYS_PER_YEAR) {
      throw new RangeError('day must be an integer between 1 and 365.');
    }
    if (!Number.isInteger(moment.hour) || moment.hour < 0 || moment.hour >= HOURS_PER_DAY) {
      throw new RangeError('hour must be an integer between 0 and 23.');
    }
    if (
      !Number.isInteger(moment.minute) ||
      moment.minute < 0 ||
      moment.minute >= MINUTES_PER_HOUR
    ) {
      throw new RangeError('minute must be an integer between 0 and 59.');
    }
    if (
      !Number.isInteger(moment.second) ||
      moment.second < 0 ||
      moment.second >= SECONDS_PER_MINUTE
    ) {
      throw new RangeError('second must be an integer between 0 and 59.');
    }
  }
}

/**
 * Convert a duration to total seconds
 *
 * @param duration - Duration object (partial allowed)
 * @returns Total seconds
 */
function durationToSeconds(duration: Partial<Duration>): number {
  const years = validateDurationPart(duration.years, 'years');
  const days = validateDurationPart(duration.days, 'days');
  const hours = validateDurationPart(duration.hours, 'hours');
  const minutes = validateDurationPart(duration.minutes, 'minutes');
  const seconds = validateDurationPart(duration.seconds, 'seconds');

  return (
    years * SEC_PER_YEAR +
    days * SEC_PER_DAY +
    hours * SEC_PER_HOUR +
    minutes * SEC_PER_MINUTE +
    seconds
  );
}

/**
 * Convert seconds to a duration object
 *
 * @param seconds - Total seconds
 * @returns Duration breakdown
 */
function secondsToDuration(seconds: number): Duration {
  if (!Number.isFinite(seconds)) {
    throw new RangeError('seconds must be a finite number.');
  }

  const sign = seconds < 0 ? -1 : 1;
  let remaining = Math.abs(Math.floor(seconds));

  const years = Math.floor(remaining / SEC_PER_YEAR);
  remaining -= years * SEC_PER_YEAR;

  const days = Math.floor(remaining / SEC_PER_DAY);
  remaining -= days * SEC_PER_DAY;

  const hours = Math.floor(remaining / SEC_PER_HOUR);
  remaining -= hours * SEC_PER_HOUR;

  const minutes = Math.floor(remaining / SEC_PER_MINUTE);
  remaining -= minutes * SEC_PER_MINUTE;

  return {
    years: applySign(years, sign),
    days: applySign(days, sign),
    hours: applySign(hours, sign),
    minutes: applySign(minutes, sign),
    seconds: applySign(remaining, sign),
  };
}

function validateDurationPart(value: number | undefined, label: keyof Duration): number {
  if (value === undefined) {
    return 0;
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer.`);
  }
  return value;
}

function applySign(value: number, sign: number): number {
  if (value === 0) {
    return 0;
  }
  return value * sign;
}
