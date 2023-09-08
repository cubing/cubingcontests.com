import { getAttempt, getFormattedTime } from '~/helpers/utilityFunctions';
import { EventFormat } from '~/shared_helpers/enums';

const multiBlindExamples = [
  {
    result: 999700043890000,
    formatted: '2/2 43.89',
    inputs: {
      time: '4389',
      solved: '2',
      attempted: '2',
    },
  },
  {
    result: 999600065570000,
    formatted: '3/3 1:05.57',
    inputs: {
      time: '10557',
      solved: '3',
      attempted: '3',
    },
  },
  {
    result: 999901499000002,
    formatted: '2/4 24:59',
    inputs: {
      time: '245900',
      solved: '2',
      attempted: '4',
    },
  },
  {
    result: 999100774000001,
    formatted: '9/10 12:54',
    inputs: {
      time: '125400',
      solved: '9',
      attempted: '10',
    },
  },
  {
    result: 995203486000004,
    formatted: '51/55 58:06',
    inputs: {
      time: '580600',
      solved: '51',
      attempted: '55',
    },
  },
  {
    result: 995803600000008,
    formatted: '49/57 1:00:00',
    inputs: {
      time: '1000000',
      solved: '49',
      attempted: '57',
    },
  },
  {
    result: 89335998000047,
    formatted: '9153/9200 9:59:58',
    inputs: {
      time: '9595800',
      solved: '9153',
      attempted: '9200',
    },
  },
  // DNFs
  {
    result: -999603161000009,
    formatted: 'DNF (6/15 52:41)',
    inputs: {
      time: '524100',
      solved: '6',
      attempted: '15',
    },
  },
  {
    result: -999900516420001,
    formatted: 'DNF (1/2 8:36.42)',
    inputs: {
      time: '83642',
      solved: '1',
      attempted: '2',
    },
  },
];

describe('getAttempt', () => {
  const dummyAtt = { result: 0 };

  describe('parse time attempts', () => {
    it('parses 553 correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Time, '553', '', '').result).toBe(553);
    });

    it('parses 2453 correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Time, '2453', '', '').result).toBe(2453);
    });

    it('parses 24253 correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Time, '24253', '', '').result).toBe(16253);
    });

    it('parses 141786 correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Time, '141786', '', '').result).toBe(85700);
    });

    it('parses 141786 without rounding correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Time, '141786', '', '', true).result).toBe(85786);
    });

    it('parses 1000284 correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Time, '1000284', '', '').result).toBe(360200);
    });

    it('parses 1000284 without rounding correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Time, '1000284', '', '', true).result).toBe(360284);
    });

    it('parses empty time correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Time, '', '', '').result).toBe(0);
    });
  });

  describe('parse Multi-Blind attempts', () => {
    it('parses 36 move FMC correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Number, '36', '', '').result).toBe(36);
    });

    it('parses empty number correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Number, '', '', '').result).toBe(0);
    });
  });

  describe('parse Multi-Blind attempts', () => {
    for (const example of multiBlindExamples) {
      it(`parses ${example.formatted} correctly`, () => {
        expect(
          getAttempt(dummyAtt, EventFormat.Multi, example.inputs.time, example.inputs.solved, example.inputs.attempted)
            .result,
        ).toBe(example.result);
      });
    }

    it('parses empty Multi-Blind attempt correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Multi, '', '', '').result).toBe(0);
    });
  });
});

describe('getFormattedTime', () => {
  describe('format time singles', () => {
    it('formats 0.07 correctly', () => {
      expect(getFormattedTime(7, EventFormat.Time)).toBe('0.07');
    });

    it('formats 0.35 correctly', () => {
      expect(getFormattedTime(35, EventFormat.Time)).toBe('0.35');
    });

    it('formats 8.80 correctly', () => {
      expect(getFormattedTime(880, EventFormat.Time)).toBe('8.80');
    });

    it('formats 10.00 correctly', () => {
      expect(getFormattedTime(1000, EventFormat.Time)).toBe('10.00');
    });

    it('formats 30.05 correctly', () => {
      expect(getFormattedTime(3005, EventFormat.Time)).toBe('30.05');
    });

    it('formats 2:45.07 correctly', () => {
      expect(getFormattedTime(16507, EventFormat.Time)).toBe('2:45.07');
    });

    // Results over ten minutes long must have no decimals
    it('formats 23:00.35 correctly', () => {
      expect(getFormattedTime(138035, EventFormat.Time)).toBe('23:00');
    });

    it('formats 1:32:08(.36) correctly', () => {
      expect(getFormattedTime(552836, EventFormat.Time)).toBe('1:32:08');
    });
  });

  describe('format time singles without formatting (no commas or colons)', () => {
    it('formats 0.09 without formatting correctly', () => {
      expect(getFormattedTime(9, EventFormat.Time, true)).toBe('9');
    });

    it('formats 0.78 without formatting correctly', () => {
      expect(getFormattedTime(78, EventFormat.Time, true)).toBe('78');
    });

    it('formats 20.00 correctly', () => {
      expect(getFormattedTime(2000, EventFormat.Time, true)).toBe('2000');
    });

    it('formats 1:08.45 without formatting correctly', () => {
      expect(getFormattedTime(6845, EventFormat.Time, true)).toBe('10845');
    });

    it('formats 12:35.00 correctly', () => {
      expect(getFormattedTime(75500, EventFormat.Time, true)).toBe('123500');
    });
  });

  describe('format numbers (FMC)', () => {
    it('formats 37 correctly', () => {
      expect(getFormattedTime(37, EventFormat.Number)).toBe('37');
    });

    it('formats 41.33 correctly', () => {
      expect(getFormattedTime(4133, EventFormat.Number)).toBe('41.33');
    });

    it('formats 40.00 correctly', () => {
      expect(getFormattedTime(4000, EventFormat.Number)).toBe('40.00');
    });

    it('formats 39.66 without formatting correctly', () => {
      expect(getFormattedTime(3966, EventFormat.Number, true)).toBe('3966');
    });
  });

  describe('format Multi-Blind attempts', () => {
    for (const example of multiBlindExamples) {
      it(`formats ${example.formatted} correctly`, () => {
        expect(getFormattedTime(example.result, EventFormat.Multi)).toBe(example.formatted);
      });

      it(`formats ${example.formatted} without formatting correctly`, () => {
        expect(getFormattedTime(example.result, EventFormat.Multi, true)).toBe(
          `${example.inputs.solved};${example.inputs.attempted};${example.inputs.time}`,
        );
      });
    }
  });

  it('formats DNF correctly', () => {
    expect(getFormattedTime(-1, EventFormat.Time)).toBe('DNF');
  });

  it('formats DNS correctly', () => {
    expect(getFormattedTime(-2, EventFormat.Time)).toBe('DNS');
  });
});
