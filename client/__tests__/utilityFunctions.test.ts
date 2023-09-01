import { formatTime } from '~/helpers/utilityFunctions';
import { EventFormat } from '~/shared_helpers/enums';

describe('formatTime', () => {
  describe('format time singles', () => {
    it('formats 0.07 correctly', () => {
      expect(formatTime(7, EventFormat.Time)).toBe('0.07');
    });

    it('formats 0.35 correctly', () => {
      expect(formatTime(35, EventFormat.Time)).toBe('0.35');
    });

    it('formats 8.80 correctly', () => {
      expect(formatTime(880, EventFormat.Time)).toBe('8.80');
    });

    it('formats 30.05 correctly', () => {
      expect(formatTime(3005, EventFormat.Time)).toBe('30.05');
    });

    it('formats 2:45.07 correctly', () => {
      expect(formatTime(16507, EventFormat.Time)).toBe('2:45.07');
    });

    // Results over ten minutes long must have no decimals
    it('formats 23:00.35 correctly', () => {
      expect(formatTime(138035, EventFormat.Time)).toBe('23:00');
    });

    it('formats 1:32:08(.36) correctly', () => {
      expect(formatTime(552836, EventFormat.Time)).toBe('1:32:08');
    });
  });

  describe('format time singles without formatting (no commas or colons)', () => {
    it('formats (0.0)9 without formatting correctly', () => {
      expect(formatTime(9, EventFormat.Time, { noFormatting: true })).toBe('9');
    });

    it('formats (0.)78 without formatting correctly', () => {
      expect(formatTime(78, EventFormat.Time, { noFormatting: true })).toBe('78');
    });

    it('formats 1:08.45 without formatting correctly', () => {
      expect(formatTime(6845, EventFormat.Time, { noFormatting: true })).toBe('10845');
    });
  });

  describe('format numbers (FMC)', () => {
    it('formats 37 correctly', () => {
      expect(formatTime(37, EventFormat.Number)).toBe('37');
    });

    it('formats 41.33 correctly', () => {
      expect(formatTime(4133, EventFormat.Number, { isAverage: true })).toBe('41.33');
    });

    it('formats 40.00 correctly', () => {
      expect(formatTime(4000, EventFormat.Number, { isAverage: true })).toBe('40.00');
    });

    it('formats 39.66 without formatting correctly', () => {
      expect(formatTime(3966, EventFormat.Number, { isAverage: true, noFormatting: true })).toBe('3966');
    });
  });

  it('formats DNF correctly', () => {
    expect(formatTime(-1, EventFormat.Time)).toBe('DNF');
  });

  it('formats DNS correctly', () => {
    expect(formatTime(-2, EventFormat.Time)).toBe('DNS');
  });
});
