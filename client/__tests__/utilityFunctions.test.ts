import { getAttempt, getFormattedTime } from '~/helpers/utilityFunctions';
import { EventFormat } from '~/shared_helpers/enums';

const timeExamples = [
  {
    inputs: { time: '553', memo: undefined as string },
    outputAtt: { result: 553, memo: undefined as number },
  },
  {
    inputs: { time: '2453', memo: undefined as string },
    outputAtt: { result: 2453, memo: undefined as number },
  },
  {
    inputs: { time: '24253', memo: undefined as string },
    outputAtt: { result: 16253, memo: undefined as number },
  },
  {
    inputs: { time: '141786', memo: undefined as string },
    outputAtt: { result: 85786, memo: undefined as number },
  },
  {
    inputs: { time: '1000284', memo: undefined as string },
    outputAtt: { result: 360284, memo: undefined as number },
  },
  // With memo
  {
    inputs: { time: '51234', memo: '25842' },
    outputAtt: { result: 31234, memo: 17842 },
  },
  {
    inputs: { time: '242344', memo: '155452' },
    outputAtt: { result: 146344, memo: 95452 },
  },
  // INVALID TIMES
  {
    inputs: { time: '248344', memo: '159452' },
    outputAtt: { result: null, memo: null },
  },
];

const multiBlindExamples = [
  {
    result: 999700043890000,
    formatted: '2/2 43.89',
    memo: undefined as number,
    inputs: {
      time: '4389',
      solved: '2',
      attempted: '2',
      memo: undefined as string,
    },
  },
  {
    result: 999600065570000,
    formatted: '3/3 1:05.57',
    memo: undefined as number,
    inputs: {
      time: '10557',
      solved: '3',
      attempted: '3',
      memo: undefined as string,
    },
  },
  {
    result: 999901499000002,
    formatted: '2/4 24:59',
    memo: undefined as number,
    inputs: {
      time: '245900',
      solved: '2',
      attempted: '4',
      memo: undefined as string,
    },
  },
  {
    result: 999100774000001,
    formatted: '9/10 12:54',
    memo: undefined as number,
    inputs: {
      time: '125400',
      solved: '9',
      attempted: '10',
      memo: undefined as string,
    },
  },
  {
    result: 995203486000004,
    formatted: '51/55 58:06',
    memo: undefined as number,
    inputs: {
      time: '580600',
      solved: '51',
      attempted: '55',
      memo: undefined as string,
    },
  },
  {
    result: 995803600000008,
    formatted: '49/57 1:00:00',
    memo: undefined as number,
    inputs: {
      time: '1000000',
      solved: '49',
      attempted: '57',
      memo: undefined as string,
    },
  },
  {
    result: 89335998000047,
    formatted: '9153/9200 9:59:58',
    memo: undefined as number,
    inputs: {
      time: '9595800',
      solved: '9153',
      attempted: '9200',
      memo: undefined as string,
    },
  },
  // DNFs
  {
    result: -999603161000009,
    formatted: 'DNF (6/15 52:41)',
    memo: undefined as number,
    inputs: {
      time: '524100',
      solved: '6',
      attempted: '15',
      memo: undefined as string,
    },
  },
  {
    result: -999900516420001,
    formatted: 'DNF (1/2 8:36.42)',
    memo: undefined as number,
    inputs: {
      time: '83642',
      solved: '1',
      attempted: '2',
      memo: undefined as string,
    },
  },
];

describe('getAttempt', () => {
  const dummyAtt = { result: 0 };

  describe('parse time attempts', () => {
    for (const example of timeExamples) {
      const { inputs, outputAtt } = example;

      it(`parses ${example.inputs.time}${example.inputs.memo ? ` with ${inputs.memo} memo` : ''} correctly`, () => {
        const output = getAttempt(dummyAtt, EventFormat.Time, inputs.time, '', '', inputs.memo);
        const expectedResult =
          outputAtt.result >= 60000 ? outputAtt.result - (outputAtt.result % 100) : outputAtt.result;
        const expectedMemo = outputAtt.memo >= 60000 ? outputAtt.memo - (outputAtt.memo % 100) : outputAtt.memo;

        expect(output.result).toBe(expectedResult);
        expect(output.memo).toBe(expectedMemo);
      });

      it(`parses ${inputs.time}${inputs.memo ? ` with ${inputs.memo} memo` : ''} without rounding correctly`, () => {
        const output = getAttempt(dummyAtt, EventFormat.Time, inputs.time, '', '', inputs.memo, true);

        expect(output.result).toBe(outputAtt.result);
        expect(output.memo).toBe(outputAtt.memo);
      });
    }

    it('parses empty time correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Time, '', '', '', undefined).result).toBe(0);
    });
  });

  describe('parse Time attempts', () => {
    it('parses 36 move FMC correctly', () => {
      const output = getAttempt(dummyAtt, EventFormat.Number, '36', '', '', undefined);
      expect(output.result).toBe(36);
      expect(output.memo).toBeUndefined();
    });

    it('parses empty number correctly', () => {
      const output = getAttempt(dummyAtt, EventFormat.Number, '', '', '', undefined);
      expect(output.result).toBe(0);
      expect(output.memo).toBe(undefined);
    });
  });

  describe('parse Multi attempts', () => {
    for (const example of multiBlindExamples) {
      const { inputs: inp } = example;

      it(`parses ${example.formatted} correctly`, () => {
        const output = getAttempt(dummyAtt, EventFormat.Multi, inp.time, inp.solved, inp.attempted, inp.memo);
        expect(output.result).toBe(example.result);
        expect(output.memo).toBe(example.memo);
      });
    }

    it('parses empty Multi-Blind attempt correctly', () => {
      expect(getAttempt(dummyAtt, EventFormat.Multi, '', '', '', undefined).result).toBe(0);
    });
  });
});

describe('getFormattedTime', () => {
  describe('format time singles', () => {
    it('formats 0.07 correctly', () => {
      expect(getFormattedTime(7)).toBe('0.07');
    });

    it('formats 0.35 correctly', () => {
      expect(getFormattedTime(35)).toBe('0.35');
    });

    it('formats 8.80 correctly', () => {
      expect(getFormattedTime(880)).toBe('8.80');
    });

    it('formats 10.00 correctly', () => {
      expect(getFormattedTime(1000)).toBe('10.00');
    });

    it('formats 30.05 correctly', () => {
      expect(getFormattedTime(3005)).toBe('30.05');
    });

    it('formats 2:45.07 correctly', () => {
      expect(getFormattedTime(16507)).toBe('2:45.07');
    });

    // Results over ten minutes long must have no decimals
    it('formats 23:00.35 correctly', () => {
      expect(getFormattedTime(138035)).toBe('23:00');
    });

    it('formats 1:32:08(.36) correctly', () => {
      expect(getFormattedTime(552836)).toBe('1:32:08');
    });
  });

  describe('format time singles without formatting (no commas or colons)', () => {
    it('formats 0.09 without formatting correctly', () => {
      expect(getFormattedTime(9, { noFormatting: true })).toBe('9');
    });

    it('formats 0.78 without formatting correctly', () => {
      expect(getFormattedTime(78, { noFormatting: true })).toBe('78');
    });

    it('formats 20.00 correctly', () => {
      expect(getFormattedTime(2000, { noFormatting: true })).toBe('2000');
    });

    it('formats 1:08.45 without formatting correctly', () => {
      expect(getFormattedTime(6845, { noFormatting: true })).toBe('10845');
    });

    it('formats 12:35.00 correctly', () => {
      expect(getFormattedTime(75500, { noFormatting: true })).toBe('123500');
    });
  });

  describe('format numbers (FMC)', () => {
    it('formats 37 correctly', () => {
      expect(getFormattedTime(37, { eventFormat: EventFormat.Number })).toBe('37');
    });

    it('formats 41.33 correctly', () => {
      expect(getFormattedTime(4133, { eventFormat: EventFormat.Number })).toBe('41.33');
    });

    it('formats 40.00 correctly', () => {
      expect(getFormattedTime(4000, { eventFormat: EventFormat.Number })).toBe('40.00');
    });

    it('formats 39.66 without formatting correctly', () => {
      expect(getFormattedTime(3966, { eventFormat: EventFormat.Number, noFormatting: true })).toBe('3966');
    });
  });

  describe('format Multi-Blind attempts', () => {
    for (const example of multiBlindExamples) {
      it(`formats ${example.formatted} correctly`, () => {
        expect(getFormattedTime(example.result, { eventFormat: EventFormat.Multi })).toBe(example.formatted);
      });

      it(`formats ${example.formatted} without formatting correctly`, () => {
        expect(getFormattedTime(example.result, { eventFormat: EventFormat.Multi, noFormatting: true })).toBe(
          `${example.inputs.solved};${example.inputs.attempted};${example.inputs.time}`,
        );
      });
    }
  });

  it('formats DNF correctly', () => {
    expect(getFormattedTime(-1)).toBe('DNF');
  });

  it('formats DNS correctly', () => {
    expect(getFormattedTime(-2)).toBe('DNS');
  });
});
