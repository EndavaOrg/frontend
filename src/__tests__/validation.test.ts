import {
  validatePhone, PHONE_ERROR, parsePreferenceField, cleanPreference, validatePreference,
} from '../utils/validation';

describe('validatePhone', () => {
  it.each([
    '040123456',
    '+38640123456',
    '040 123 456',
    '040-123-456',
    '01/234.5678',
    '123456',          // lower bound: 6 digits
    '123456789012345', // upper bound: 15 digits
  ])('should accept %p', (phone) => {
    expect(validatePhone(phone)).toBe('');
  });

  it.each([
    ['', 'empty'],
    ['12345', '5 digits (below minimum)'],
    ['1234567890123456', '16 digits (above maximum)'],
    ['04012a456', 'letters'],
    ['++38640123456', 'double plus'],
    ['040+123456', 'plus not at the start'],
    ['   ', 'only spaces'],
  ])('should reject %p (%s)', (phone) => {
    // Not just toBe(PHONE_ERROR): if the constant were accidentally '', invalid numbers
    // would be reported as valid and a toBe(PHONE_ERROR) check would still pass.
    expect(validatePhone(phone)).not.toBe('');
    expect(validatePhone(phone)).toBe(PHONE_ERROR);
  });

  it('should not throw for a missing value and report it as invalid', () => {
    expect(validatePhone(undefined as unknown as string)).toMatch(/telefonsko številko/);
  });
});

describe('parsePreferenceField', () => {
  it('should convert numeric fields to numbers', () => {
    expect(parsePreferenceField('price_eur', '15000')).toBe(15000);
    expect(parsePreferenceField('first_registration', '2018')).toBe(2018);
  });

  it('should keep an empty numeric field as an empty string', () => {
    expect(parsePreferenceField('mileage_km', '')).toBe('');
    expect(parsePreferenceField('mileage_km', '   ')).toBe('');
  });

  it('should leave text fields as strings even if they look numeric', () => {
    expect(parsePreferenceField('model', '3008')).toBe('3008');
  });

  it('should produce NaN for non-numeric input in a numeric field (rejected later by validation)', () => {
    expect(parsePreferenceField('price_eur', 'abc')).toBeNaN();
  });
});

describe('cleanPreference', () => {
  it('should remove empty, undefined and null fields but keep 0', () => {
    const cleaned = cleanPreference({
      make: 'Audi', model: '', price_eur: '', mileage_km: 0, fuel_type: undefined,
      gearbox: null as unknown as string,
    });
    expect(cleaned).toEqual({ make: 'Audi', mileage_km: 0 });
  });
});

describe('validatePreference', () => {
  const NOW = new Date('2026-06-15T12:00:00Z');

  it('should accept a preference with only a make', () => {
    expect(validatePreference({ make: 'BMW' }, NOW)).toEqual([]);
  });

  it('should accept a preference with only a model', () => {
    expect(validatePreference({ model: 'Golf' }, NOW)).toEqual([]);
  });

  it('should require a make or a model', () => {
    expect(validatePreference({ price_eur: 10000 }, NOW)).toEqual(['Vnesi vsaj znamko ali model.']);
  });

  it('should treat whitespace-only make and model as missing', () => {
    expect(validatePreference({ make: '  ', model: '\t' }, NOW)).toContain('Vnesi vsaj znamko ali model.');
  });

  it('should reject negative numbers', () => {
    const errors = validatePreference({ make: 'BMW', price_eur: -1 }, NOW);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/^price_eur:.*negativno/);
  });

  it('should ignore numeric fields that are still empty strings (not cleaned yet)', () => {
    expect(validatePreference({ make: 'BMW', price_eur: '', first_registration: '' }, NOW)).toEqual([]);
  });

  it('should accept zero for numeric fields', () => {
    expect(validatePreference({ make: 'BMW', mileage_km: 0 }, NOW)).toEqual([]);
  });

  it('should reject NaN produced by unparsable input', () => {
    const errors = validatePreference({ make: 'BMW', mileage_km: NaN }, NOW);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/^mileage_km:.*število/);
  });

  it.each([1900, 2010, 2026])('should accept registration year %p', (year) => {
    expect(validatePreference({ make: 'BMW', first_registration: year }, NOW)).toEqual([]);
  });

  it.each([1899, 2027, 2010.5])('should reject registration year %p', (year) => {
    const errors = validatePreference({ make: 'BMW', first_registration: year }, NOW);
    expect(errors).toEqual(['first_registration: letnik mora biti med 1900 in 2026.']);
  });

  it('should report every problem at once', () => {
    const errors = validatePreference({ price_eur: -5, first_registration: 1800 }, NOW);
    expect(errors).toHaveLength(3);
  });

  it('should default to the current date', () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(validatePreference({ make: 'BMW', first_registration: nextYear })).toHaveLength(1);
  });
});
