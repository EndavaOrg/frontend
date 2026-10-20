import { toKw, cleanParams, buildSearchParams, buildSearchQuery } from '../utils/searchQuery';

// Mirrors the initial state of the three search forms.
const emptyCarForm = {
  make: '', model: '', yearFrom: '', mileageFrom: '', mileageTo: '',
  fuel_type: '', shifter_type: '', powerUnit: 'kW',
  powerFrom: '', powerTo: '', priceFrom: '', priceTo: '',
  engineCcmFrom: '', engineCcmTo: '',
};
const emptyTruckForm = {
  make: '', model: '', yearFrom: '', mileageFrom: '', mileageTo: '',
  fuel_type: '', gearbox: '', priceFrom: '', priceTo: '',
  engineKwFrom: '', engineKwTo: '',
};

describe('toKw', () => {
  it.each([
    [136, 100],   // exact
    [68, 50],     // exact
    [34, 25],     // exact
    [205, 151],   // 150.74 -> rounds up
    [10, 7],      // 7.35  -> rounds down
    [27, 20],     // 19.85 -> rounds up
    [0, 0],
  ])('should convert %p HP to %p kW', (hp, kw) => {
    expect(toKw(hp, 'HP')).toBe(kw);
  });

  it('should leave kW values unchanged', () => {
    expect(toKw(110, 'kW')).toBe(110);
  });

  it('should round fractional kW values to whole kilowatts', () => {
    expect(toKw(74.6, 'kW')).toBe(75);
  });

  it.each([NaN, Infinity, -Infinity])('should throw RangeError for non-finite value %p', (v) => {
    expect(() => toKw(v, 'HP')).toThrow(new RangeError(`Invalid power value: ${v}`));
  });
});

describe('cleanParams', () => {
  it('should drop empty string, null and undefined values', () => {
    expect(cleanParams({ a: '', b: null, c: undefined, d: 'x' })).toEqual({ d: 'x' });
  });

  it('should keep falsy-but-meaningful values such as 0', () => {
    expect(cleanParams({ mileageFrom: 0 })).toEqual({ mileageFrom: '0' });
  });

  it('should return an empty object for an empty input', () => {
    expect(cleanParams({})).toEqual({});
  });
});

describe('buildSearchParams', () => {
  it('should send no filters for an untouched car form', () => {
    // powerUnit defaults to "kW" but is a UI-only setting, not a filter
    expect(buildSearchParams(emptyCarForm)).toStrictEqual({});
  });

  it('should copy yearFrom into first_registration', () => {
    const params = buildSearchParams({ ...emptyCarForm, yearFrom: '2015' });
    expect(params).toMatchObject({ yearFrom: '2015', first_registration: '2015' });
  });

  it('should convert HP power limits to kW', () => {
    const params = buildSearchParams({ ...emptyCarForm, powerUnit: 'HP', powerFrom: '136', powerTo: '204' });
    expect(params).toEqual({ engineKwFrom: '100', engineKwTo: '150' });
  });

  it('should pass kW power limits through as engineKw filters', () => {
    const params = buildSearchParams({ ...emptyCarForm, powerFrom: '51', powerTo: '75' });
    expect(params).toEqual({ engineKwFrom: '51', engineKwTo: '75' });
  });

  it('should convert only the limit that is set', () => {
    expect(buildSearchParams({ ...emptyCarForm, powerUnit: 'HP', powerTo: '68' })).toEqual({ engineKwTo: '50' });
  });

  it('should ignore a non-numeric power value instead of sending NaN', () => {
    const params = buildSearchParams({ ...emptyCarForm, powerUnit: 'HP', powerFrom: 'abc' });
    expect(params).toEqual({});
  });

  it('should keep the truck form engineKw filters as given', () => {
    const params = buildSearchParams({ ...emptyTruckForm, engineKwFrom: '300', gearbox: 'ročni' });
    expect(params).toEqual({ engineKwFrom: '300', gearbox: 'ročni' });
  });

  it('should not mutate the form object', () => {
    const form = { ...emptyCarForm, powerUnit: 'HP', powerFrom: '136', yearFrom: '2010' };
    const snapshot = { ...form };
    buildSearchParams(form);
    expect(form).toEqual(snapshot);
  });
});

describe('buildSearchQuery', () => {
  it('should URL-encode values with spaces and special characters', () => {
    const q = buildSearchQuery({ ...emptyCarForm, make: 'Mercedes-Benz', model: 'C 200 & AMG' });
    expect(new URLSearchParams(q).get('model')).toBe('C 200 & AMG');
    expect(q).not.toContain(' ');
  });

  it('should return an empty string when no filters are set', () => {
    expect(buildSearchQuery(emptyCarForm)).toBe('');
  });
});
