import { MONEY_MAX_DECIMALS, parseMoney, parseMoneyModel } from './parse-money';

const valid = (canonical: string) => ({ status: 'valid', canonical });
const INVALID = { status: 'invalid' };
const EMPTY = { status: 'empty' };

describe('parseMoney (de)', () => {
  it.each([
    ['12', '12'],
    ['12,', '12'],
    ['1,5', '1.5'],
    ['1,50', '1.50'],
    [',5', '0.5'],
    ['1.234', '1234'],
    ['1.234,56', '1234.56'],
    ['1.234.567,89', '1234567.89'],
    ['1234,56', '1234.56'],
    ['007,50', '7.50'],
    ['000', '0'],
    ['-5', '-5'],
    ['-1.234,5', '-1234.5'],
    ['  12,3 ', '12.3'],
    ['12,30 €', '12.30'],
    ['€12', '12'],
  ])('reads %p as %p', (raw, canonical) => {
    expect(parseMoney(raw, 'de')).toEqual(valid(canonical));
  });

  it.each([
    ['12,345'], // 3 decimals
    ['1,999'],
    ['abc'],
    ['12a'],
    ['1.23'], // a group of 2
    ['1.2345'], // a group of 4
    ['1234.5'], // dot is not the decimal separator in de
    ['0.123'], // a grouped integer cannot start with 0
    [',,5'],
    ['1,2,3'],
    [','],
    ['--5'],
    ['5-'],
    ['1 234'],
  ])('rejects %p', (raw) => {
    expect(parseMoney(raw, 'de')).toEqual(INVALID);
  });

  it.each([[''], ['   '], ['-'], [null], [undefined], ['€']])('reads %p as empty', (raw) => {
    expect(parseMoney(raw, 'de')).toEqual(EMPTY);
  });
});

describe('parseMoney (en)', () => {
  it.each([
    ['12,345', '12345'],
    ['1,234.56', '1234.56'],
    ['12.', '12'],
    ['1.5', '1.5'],
    ['.5', '0.5'],
    ['-5', '-5'],
  ])('reads %p as %p', (raw, canonical) => {
    expect(parseMoney(raw, 'en')).toEqual(valid(canonical));
  });

  it.each([['12.345'], ['1,234,5'], ['1,23'], ['1,234,56.7'], ['abc'], ['1.234,56']])(
    'rejects %p',
    (raw) => {
      expect(parseMoney(raw, 'en')).toEqual(INVALID);
    },
  );
});

describe('parseMoneyModel', () => {
  it('limits user input to cents', () => {
    expect(MONEY_MAX_DECIMALS).toBe(2);
  });

  it('reads empty values', () => {
    expect(parseMoneyModel(null, 'de')).toEqual(EMPTY);
    expect(parseMoneyModel(undefined, 'de')).toEqual(EMPTY);
    expect(parseMoneyModel('  ', 'de')).toEqual(EMPTY);
  });

  it('reads numbers and keeps every decimal', () => {
    expect(parseMoneyModel(12.345, 'de')).toEqual(valid('12.345'));
    expect(parseMoneyModel(-3, 'de')).toEqual(valid('-3'));
    expect(parseMoneyModel(Number.NaN, 'de')).toEqual(INVALID);
  });

  it('reads a canonical string in every locale', () => {
    expect(parseMoneyModel('1234.56', 'de')).toEqual(valid('1234.56'));
    expect(parseMoneyModel('1.234', 'de')).toEqual(valid('1.234'));
    expect(parseMoneyModel('-007.5', 'en')).toEqual(valid('-7.5'));
    expect(parseMoneyModel('0', 'de')).toEqual(valid('0'));
  });

  it('falls back to the locale parser for other text', () => {
    expect(parseMoneyModel('1.234,56', 'de')).toEqual(valid('1234.56'));
    expect(parseMoneyModel('1,234.56', 'en')).toEqual(valid('1234.56'));
    expect(parseMoneyModel('abc', 'de')).toEqual(INVALID);
  });
});
