import { sortVehicles, paginate, classifyVehicle } from '../utils/vehicleList';

const v = (id: string, price_eur?: number | null, mileage_km?: number) => ({ _id: id, price_eur, mileage_km });
const ids = (list: { _id: string }[]) => list.map((x) => x._id);

describe('sortVehicles', () => {
  const list = [v('a', 5000, 90000), v('b', 1500, 120000), v('c', 9000, 10000)];

  it('should sort by price ascending', () => {
    expect(ids(sortVehicles(list, 'price-asc'))).toEqual(['b', 'a', 'c']);
  });

  it('should sort by price descending', () => {
    expect(ids(sortVehicles(list, 'price-desc'))).toEqual(['c', 'a', 'b']);
  });

  it('should sort by mileage ascending and descending', () => {
    expect(ids(sortVehicles(list, 'mileage-asc'))).toEqual(['c', 'a', 'b']);
    expect(ids(sortVehicles(list, 'mileage-desc'))).toEqual(['b', 'a', 'c']);
  });

  it('should keep the original order for "none"', () => {
    expect(ids(sortVehicles(list, 'none'))).toEqual(['a', 'b', 'c']);
  });

  // Missing values are placed at the start, middle and end of the input, because a
  // comparator that is only correct for one argument order can still pass a single case.
  it.each([
    [['m1', 'x', 'm2', 'y', 'm3']],
    [['x', 'y', 'm1', 'm2', 'm3']],
    [['m1', 'm2', 'm3', 'x', 'y']],
    [['m1', 'y', 'm2', 'x', 'm3']],
  ])('should put listings without a price last in both directions (input %j)', (order) => {
    const byId: Record<string, ReturnType<typeof v>> = {
      x: v('x', 3000), y: v('y', 1000), m1: v('m1', null), m2: v('m2', undefined), m3: v('m3', NaN),
    };
    const input = order.map((id) => byId[id]);
    expect(ids(sortVehicles(input, 'price-asc'))).toEqual(['y', 'x', 'm1', 'm2', 'm3']);
    expect(ids(sortVehicles(input, 'price-desc'))).toEqual(['x', 'y', 'm1', 'm2', 'm3']);
  });

  it('should ignore non-numeric price values such as strings from a bad API response', () => {
    const odd = [v('str', '500' as any), v('x', 3000), v('y', 1000)];
    expect(ids(sortVehicles(odd, 'price-asc'))).toEqual(['y', 'x', 'str']);
  });

  it('should treat a price of 0 as a real value, not as missing', () => {
    const free = [v('missing', null), v('zero', 0), v('x', 100)];
    expect(ids(sortVehicles(free, 'price-asc'))).toEqual(['zero', 'x', 'missing']);
  });

  it('should keep equal values in their original order', () => {
    const ties = [v('first', 1000), v('second', 1000), v('third', 500)];
    expect(ids(sortVehicles(ties, 'price-asc'))).toEqual(['third', 'first', 'second']);
  });

  it('should not mutate the input array', () => {
    const input = [...list];
    sortVehicles(input, 'price-asc');
    expect(ids(input)).toEqual(['a', 'b', 'c']);
  });

  it('should return an empty array for empty input', () => {
    expect(sortVehicles([], 'price-desc')).toEqual([]);
  });

  it('should leave order unchanged for an unknown sort value', () => {
    expect(ids(sortVehicles(list, 'color' as any))).toEqual(['a', 'b', 'c']);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 45 }, (_, i) => i + 1);

  it('should return the first page', () => {
    const p = paginate(items, 1, 20);
    expect(p.items).toEqual(items.slice(0, 20));
    expect(p).toMatchObject({ page: 1, totalPages: 3 });
  });

  it('should return a partial last page', () => {
    expect(paginate(items, 3, 20).items).toEqual([41, 42, 43, 44, 45]);
  });

  it('should not create an extra page when items divide evenly', () => {
    expect(paginate(items.slice(0, 40), 1, 20).totalPages).toBe(2);
  });

  it('should report page 1 of 1 for an empty list', () => {
    expect(paginate([], 1, 20)).toEqual({ items: [], page: 1, totalPages: 1 });
  });

  it.each([
    [0, 1],
    [-3, 1],
    [99, 3],
    [NaN, 1],
  ])('should clamp requested page %p to %p', (requested, expected) => {
    expect(paginate(items, requested, 20).page).toBe(expected);
  });

  it('should show the last page contents when the page is past the end', () => {
    expect(paginate(items, 99, 20).items).toEqual([41, 42, 43, 44, 45]);
  });

  it.each([0, -1, 2.5])('should throw RangeError for invalid perPage %p', (perPage) => {
    expect(() => paginate(items, 1, perPage)).toThrow(new RangeError(`perPage must be a positive integer, got ${perPage}`));
  });
});

describe('classifyVehicle', () => {
  const carLike = { make: 'VW', model: 'Golf', fuel_type: 'Diesel', gearbox: 'Manual', engine_kw: 85, first_registration: 2015 };
  const motoLike = { make: 'KTM', model: 'Duke', engine_kw: 70 };

  // Each hint is checked against an object whose shape suggests a *different* kind,
  // otherwise the shape fallback alone would make the test pass.
  it.each([
    ['car', { make: 'KTM', model: 'Duke', engine_kw: 70 }],
    ['motorcycle', { make: 'VW', model: 'Golf', fuel_type: 'Diesel', gearbox: 'Manual', engine_kw: 85 }],
    ['truck', { make: 'VW', model: 'Golf', fuel_type: 'Diesel', gearbox: 'Manual', engine_kw: 85 }],
  ] as const)('should trust the search type "%s" over the object shape', (type, item) => {
    expect(classifyVehicle(item, type)).toBe(type);
  });

  it('should classify a car with a registration year as a car only (not also a truck)', () => {
    // The old type guards matched both isCar and isTruck, rendering the details twice.
    expect(classifyVehicle(carLike)).toBe('car');
  });

  it('should classify an object with power but no fuel/gearbox as a motorcycle', () => {
    expect(classifyVehicle(motoLike)).toBe('motorcycle');
  });

  it('should return unknown when no distinguishing fields exist', () => {
    expect(classifyVehicle({ make: 'X', model: 'Y' })).toBe('unknown');
  });

  it('should fall back to the shape when the search type is invalid or missing', () => {
    expect(classifyVehicle(motoLike, 'boat')).toBe('motorcycle');
    expect(classifyVehicle(motoLike, null)).toBe('motorcycle');
  });

  it('should require both fuel_type and gearbox to infer a car', () => {
    expect(classifyVehicle({ fuel_type: 'Diesel', engine_kw: 50 })).toBe('motorcycle');
  });
});
