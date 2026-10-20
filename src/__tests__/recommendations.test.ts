import axios from 'axios';
import {
  buildPreferenceParams, fetchRecommendations, MAX_RECOMMENDATIONS,
  type RecommendationPreference,
} from '../utils/recommendations';

jest.mock('axios');
const mockedGet = axios.get as jest.MockedFunction<typeof axios.get>;

const BASE = 'http://api.test';
const listing = (id: string) => ({ _id: id, make: 'M', model: id });
const many = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => listing(`${prefix}${i}`));

type Route = (path: string, params: URLSearchParams) => unknown[] | Error;

/** Routes mocked axios.get calls to a handler that sees the path and query separately. */
function serve(route: Route) {
  mockedGet.mockImplementation(async (url: string) => {
    const u = new URL(url);
    const result = route(u.pathname, u.searchParams);
    if (result instanceof Error) throw result;
    return { data: result } as any;
  });
}

const calls = () => mockedGet.mock.calls.map(([url]) => new URL(url as string));
const isLatestCars = (path: string, q: URLSearchParams) => path === '/api/cars' && q.get('sort') === '-_id';

beforeEach(() => {
  mockedGet.mockReset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('buildPreferenceParams', () => {
  it('should map preference fields to range filters', () => {
    expect(buildPreferenceParams({
      make: 'Audi', model: 'A4', fuel_type: 'Diesel', gearbox: 'Manual',
      first_registration: 2015, mileage_km: 150000, price_eur: 12000,
    })).toEqual({
      make: 'Audi', model: 'A4', fuel_type: 'Diesel', gearbox: 'Manual',
      first_registration_gte: '2015', mileage_km_lte: '150000', price_eur_lte: '12000',
    });
  });

  it('should omit fields that are not set', () => {
    // toStrictEqual: toEqual would accept { make: 'Audi', model: undefined },
    // which URLSearchParams turns into "model=undefined".
    expect(buildPreferenceParams({ make: 'Audi' })).toStrictEqual({ make: 'Audi' });
    expect(buildPreferenceParams({})).toStrictEqual({});
  });

  it('should not put unset fields into the request URL', async () => {
    serve(() => []);
    await fetchRecommendations(BASE, [{ make: 'Audi' }]);
    expect(String(mockedGet.mock.calls[0][0])).not.toContain('undefined');
  });

  it('should not send the internal _vehicleType marker', () => {
    expect(buildPreferenceParams({ make: 'KTM', _vehicleType: 'motorcycle' })).not.toHaveProperty('_vehicleType');
  });
});

describe('fetchRecommendations', () => {
  it('should return the newest cars when there are no preferences', async () => {
    serve((path, q) => (isLatestCars(path, q) ? many('new', 12) : []));
    const result = await fetchRecommendations(BASE);
    expect(result.map((x) => x._id)).toEqual(many('new', 12).map((x) => x._id));
    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(calls()[0].searchParams.get('limit')).toBe('12');
  });

  it('should use the full filter match first and not call the fallbacks', async () => {
    serve((path, q) => {
      if (isLatestCars(path, q)) return [];
      return q.get('model') === 'A4' ? [listing('exact')] : [listing('wrong')];
    });
    const result = await fetchRecommendations(BASE, [{ make: 'Audi', model: 'A4', _vehicleType: 'car' }]);
    expect(result[0]._id).toBe('exact');
    const prefCalls = calls().filter((u) => u.searchParams.get('limit') === '1');
    expect(prefCalls).toHaveLength(1);
  });

  it('should request a single listing per preference attempt', async () => {
    serve(() => []);
    await fetchRecommendations(BASE, [{ make: 'Audi' }]);
    calls().filter((u) => !isLatestCars(u.pathname, u.searchParams))
      .forEach((u) => expect(u.searchParams.get('limit')).toBe('1'));
  });

  it('should fall back to the make only when the full filters find nothing', async () => {
    serve((path, q) => {
      if (isLatestCars(path, q)) return [];
      if (q.get('model')) return [];
      return q.get('make') === 'Audi' ? [listing('same-make')] : [listing('any')];
    });
    const result = await fetchRecommendations(BASE, [{ make: 'Audi', model: 'Q9' }]);
    expect(result.map((x) => x._id)).toEqual(['same-make']);
  });

  it('should fall back to any listing of that type when the make finds nothing', async () => {
    serve((path, q) => {
      if (isLatestCars(path, q)) return [];
      return q.get('make') ? [] : [listing('any-truck')];
    });
    const result = await fetchRecommendations(BASE, [{ make: 'Tatra', _vehicleType: 'truck' }]);
    expect(result.map((x) => x._id)).toEqual(['any-truck']);
    expect(calls().filter((u) => u.pathname === '/api/trucks')).toHaveLength(3);
  });

  it('should skip the make fallback when the preference has no make', async () => {
    serve(() => []);
    await fetchRecommendations(BASE, [{ model: 'Golf', _vehicleType: 'car' }]);
    const prefCalls = calls().filter((u) => u.searchParams.get('limit') === '1');
    expect(prefCalls.map((u) => [...u.searchParams.keys()].sort())).toEqual([['limit', 'model'], ['limit']]);
  });

  it('should query the endpoint matching the vehicle type, defaulting to cars', async () => {
    serve((path, q) => (isLatestCars(path, q) ? [] : [listing(path)]));
    await fetchRecommendations(BASE, [
      { make: 'KTM', _vehicleType: 'motorcycle' },
      { make: 'MAN', _vehicleType: 'truck' },
      { make: 'VW' },
    ]);
    const paths = calls().filter((u) => u.searchParams.get('limit') === '1').map((u) => u.pathname);
    expect(paths).toEqual(['/api/motorcycles', '/api/trucks', '/api/cars']);
  });

  it('should not return the same listing twice', async () => {
    serve((path, q) => (isLatestCars(path, q) ? [listing('dup'), listing('n1')] : [listing('dup')]));
    const result = await fetchRecommendations(BASE, [{ make: 'A' }, { make: 'B' }]);
    expect(result.map((x) => x._id)).toEqual(['dup', 'n1']);
  });

  it(`should never return more than ${MAX_RECOMMENDATIONS} listings`, async () => {
    let n = 0;
    serve((path, q) => (isLatestCars(path, q) ? many('new', 20) : [listing(`p${n++}`)]));
    const prefs: RecommendationPreference[] = Array.from({ length: 15 }, (_, i) => ({ make: `M${i}` }));
    const result = await fetchRecommendations(BASE, prefs);
    expect(result).toHaveLength(MAX_RECOMMENDATIONS);
    expect(mockedGet).toHaveBeenCalledTimes(MAX_RECOMMENDATIONS); // stops querying once full
  });

  it('should top up preference results with newest cars', async () => {
    serve((path, q) => (isLatestCars(path, q) ? many('new', 12) : [listing('pref')]));
    const result = await fetchRecommendations(BASE, [{ make: 'Audi' }]);
    expect(result).toHaveLength(12);
    expect(result[0]._id).toBe('pref');
    expect(result[11]._id).toBe('new10');
  });

  it('should skip a preference whose request fails and continue with the rest', async () => {
    serve((path, q) => {
      if (isLatestCars(path, q)) return [];
      return q.get('make') === 'Broken' ? new Error('500') : [listing('ok')];
    });
    const result = await fetchRecommendations(BASE, [{ make: 'Broken' }, { make: 'Fine' }]);
    expect(result.map((x) => x._id)).toEqual(['ok']);
    expect(console.error).toHaveBeenCalled();
  });

  it('should return preference results when fetching the newest cars fails', async () => {
    serve((path, q) => (isLatestCars(path, q) ? new Error('timeout') : [listing('pref')]));
    await expect(fetchRecommendations(BASE, [{ make: 'Audi' }])).resolves.toEqual([listing('pref')]);
  });

  it('should resolve to an empty list when the backend is completely down', async () => {
    serve(() => new Error('ECONNREFUSED'));
    await expect(fetchRecommendations(BASE, [{ make: 'Audi' }])).resolves.toEqual([]);
  });

  it('should treat a non-array response body as no results', async () => {
    serve(() => ({ error: 'bad' }) as any);
    await expect(fetchRecommendations(BASE, [{ make: 'Audi' }])).resolves.toEqual([]);
  });

  it('should prefix every request with the given base URL', async () => {
    serve(() => []);
    await fetchRecommendations(BASE, [{ make: 'Audi' }]);
    mockedGet.mock.calls.forEach(([url]) => expect(url).toMatch(/^http:\/\/api\.test\/api\//));
  });
});
