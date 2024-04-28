import { getAttempt } from '~/helpers/utilityFunctions';
import { EventFormat, EventGroup } from '@sh/enums';
import { IEvent } from '@sh/types';
import C from '@sh/constants';
import { getFormattedTime } from '@sh/sharedFunctions';
import { mockTimeEvent } from '~/__mocks__/events.stub';

const roundOpts = {
  roundTime: true,
  roundMemo: true,
};

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
  {
    inputs: { time: '11510694', memo: undefined as string },
    outputAtt: { result: 4266694, memo: undefined as number },
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
    inputs: { time: '248344', memo: '653452' }, // 83 seconds; 65 minutes
    outputAtt: { result: null, memo: null },
  },
  {
    inputs: { time: '155452', memo: '242344' }, // memo longer than time
    outputAtt: { result: null, memo: 146344 },
  },
  {
    inputs: { time: '25085622', memo: undefined as string }, // > 24 hours
    outputAtt: { result: null, memo: undefined as number },
  },
];

const mockNumberEvent = {
  eventId: '333fm',
  format: EventFormat.Number,
  groups: [EventGroup.WCA],
} as IEvent;

const mockMultiEvent = {
  eventId: '333mbf',
  format: EventFormat.Multi,
  groups: [EventGroup.WCA],
} as IEvent;

const mockOldStyleEvent = {
  eventId: '333mbo',
  format: EventFormat.Multi,
  groups: [EventGroup.ExtremeBLD],
} as IEvent;

const multiBlindExamples = [
  {
    result: 999700043890000,
    formatted: '2/2 43.89',
    memo: undefined as number,
    inputs: {
      time: '4389',
      solved: 2,
      attempted: 2,
      memo: undefined as string,
    },
  },
  {
    result: 999600065570000,
    formatted: '3/3 1:05.57',
    memo: undefined as number,
    inputs: {
      time: '10557',
      solved: 3,
      attempted: 3,
      memo: undefined as string,
    },
  },
  {
    result: 999901499000002,
    formatted: '2/4 24:59',
    memo: undefined as number,
    inputs: {
      time: '245900',
      solved: 2,
      attempted: 4,
      memo: undefined as string,
    },
  },
  {
    result: 999100774000001,
    formatted: '9/10 12:54',
    memo: undefined as number,
    inputs: {
      time: '125400',
      solved: 9,
      attempted: 10,
      memo: undefined as string,
    },
  },
  {
    result: 995203486000004,
    formatted: '51/55 58:06',
    memo: undefined as number,
    inputs: {
      time: '580600',
      solved: 51,
      attempted: 55,
      memo: undefined as string,
    },
  },
  {
    result: 995803600000008,
    formatted: '49/57 1:00:00',
    memo: undefined as number,
    inputs: {
      time: '1000000',
      solved: 49,
      attempted: 57,
      memo: undefined as string,
    },
  },
  {
    result: 89335998000047,
    formatted: '9153/9200 9:59:58', // Old Style
    memo: undefined as number,
    inputs: {
      time: '9595800',
      solved: 9153,
      attempted: 9200,
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
      solved: 6,
      attempted: 15,
      memo: undefined as string,
    },
  },
  {
    result: -999900516420001,
    formatted: 'DNF (1/2 8:36.42)',
    memo: undefined as number,
    inputs: {
      time: '83642',
      solved: 1,
      attempted: 2,
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
        const output = getAttempt(dummyAtt, mockTimeEvent, inputs.time, { ...roundOpts, memo: inputs.memo });
        const expectedResult =
          outputAtt.result >= 60000 ? outputAtt.result - (outputAtt.result % 100) : outputAtt.result;
        const expectedMemo = outputAtt.memo >= 60000 ? outputAtt.memo - (outputAtt.memo % 100) : outputAtt.memo;

        expect(output.result).toBe(expectedResult);
        expect(output.memo).toBe(expectedMemo);
      });

      it(`parses ${inputs.time}${inputs.memo ? ` with ${inputs.memo} memo` : ''} without rounding correctly`, () => {
        const output = getAttempt(dummyAtt, mockTimeEvent, inputs.time, { memo: inputs.memo });

        expect(output.result).toBe(outputAtt.result);
        expect(output.memo).toBe(outputAtt.memo);
      });
    }

    it('parses empty time correctly', () => {
      expect(getAttempt(dummyAtt, mockTimeEvent, '', roundOpts).result).toBe(0);
    });
  });

  describe('parse Time attempts', () => {
    it('parses 36 move FMC correctly', () => {
      const output = getAttempt(dummyAtt, mockNumberEvent, '36', roundOpts);
      expect(output.result).toBe(36);
      expect(output.memo).toBeUndefined();
    });

    it('parses empty number correctly', () => {
      const output = getAttempt(dummyAtt, mockNumberEvent, '', roundOpts);
      expect(output.result).toBe(0);
      expect(output.memo).toBe(undefined);
    });
  });

  describe('parse Multi attempts', () => {
    for (const example of multiBlindExamples) {
      const { inputs: inp } = example;

      if (Number(inp.time) <= 1002000) {
        it(`parses ${example.formatted} for Multi-Blind correctly`, () => {
          const output = getAttempt(dummyAtt, mockMultiEvent, inp.time, {
            ...roundOpts,
            solved: inp.solved,
            attempted: inp.attempted,
            memo: inp.memo,
          });
          expect(output.result).toBe(output.result);
          expect(output.memo).toBe(example.memo);
        });

        it(`disallows ${example.formatted} for Multi-Blind Old Style`, () => {
          const output = getAttempt(dummyAtt, mockOldStyleEvent, inp.time, {
            ...roundOpts,
            solved: inp.solved,
            attempted: inp.attempted,
            memo: inp.memo,
          });
          expect(output.result).toBe(null);
          expect(output.memo).toBe(example.memo);
        });
      } else {
        it(`parses ${example.formatted} for Multi-Blind Old Style correctly`, () => {
          const output = getAttempt(dummyAtt, mockOldStyleEvent, inp.time, {
            ...roundOpts,
            solved: inp.solved,
            attempted: inp.attempted,
            memo: inp.memo,
          });
          expect(output.result).toBe(output.result);
          expect(output.memo).toBe(example.memo);
        });

        it(`disallows ${example.formatted} for Multi-Blind`, () => {
          const output = getAttempt(dummyAtt, mockMultiEvent, inp.time, {
            ...roundOpts,
            solved: inp.solved,
            attempted: inp.attempted,
            memo: inp.memo,
          });
          expect(output.result).toBe(null);
          expect(output.memo).toBe(example.memo);
        });
      }
    }

    it('parses empty Multi-Blind attempt correctly', () => {
      expect(getAttempt(dummyAtt, mockMultiEvent, '', roundOpts).result).toBe(0);
    });

    it('disallows unknown time for Multi-Blind', () => {
      expect(getAttempt(dummyAtt, mockMultiEvent, '24000000', { solved: 36, attempted: 36 }).result).toBeNull();
    });

    it('parses Multi-Blind Old Style attempt with unknown time correctly', () => {
      expect(getAttempt(dummyAtt, mockOldStyleEvent, '24000000', { solved: 36, attempted: 36 }).result).toBe(
        996386400000000,
      );
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
      expect(getFormattedTime(37, { event: mockNumberEvent })).toBe('37');
    });

    it('formats 41.33 correctly', () => {
      expect(getFormattedTime(4133, { event: mockNumberEvent })).toBe('41.33');
    });

    it('formats 40.00 correctly', () => {
      expect(getFormattedTime(4000, { event: mockNumberEvent })).toBe('40.00');
    });

    it('formats 39.66 without formatting correctly', () => {
      expect(getFormattedTime(3966, { event: mockNumberEvent, noFormatting: true })).toBe('3966');
    });
  });

  describe('format Multi-Blind attempts', () => {
    for (const example of multiBlindExamples) {
      it(`formats ${example.formatted} correctly`, () => {
        expect(getFormattedTime(example.result, { event: mockMultiEvent })).toBe(example.formatted);
      });

      it(`formats ${example.formatted} without formatting correctly`, () => {
        expect(getFormattedTime(example.result, { event: mockMultiEvent, noFormatting: true })).toBe(
          `${example.inputs.solved};${example.inputs.attempted};${example.inputs.time}`,
        );
      });
    }

    it('formats Multi-Blind result with unknown time correctly', () => {
      expect(getFormattedTime(996386400000000, { event: mockMultiEvent })).toBe('36/36 Unknown time');
    });
  });

  it('formats DNF correctly', () => {
    expect(getFormattedTime(-1)).toBe('DNF');
  });

  it('formats DNS correctly', () => {
    expect(getFormattedTime(-2)).toBe('DNS');
  });

  it('formats unknown time correctly', () => {
    expect(getFormattedTime(C.maxTime)).toBe('Unknown');
  });

  it('formats Multi attempt with unknown time correctly', () => {
    const attempt = Number(`9995${C.maxTime}0001`);
    expect(getFormattedTime(attempt, { event: mockMultiEvent })).toBe('5/6 Unknown time');
  });

  it('formats 0:34 memo time correctly', () => {
    expect(getFormattedTime(3400, { alwaysShowMinutes: true, showDecimals: false })).toBe('0:34');
  });

  it('formats 14:07 memo time correctly', () => {
    expect(getFormattedTime(84700, { showDecimals: false })).toBe('14:07');
  });
});
