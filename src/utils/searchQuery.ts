/**
 * Shared logic for turning a search-form state into backend query parameters.
 * Previously duplicated (with differences) in SearchForm, MotorcycleSearchForm,
 * TruckSearchForm and Results.
 */

/** Metric horsepower (PS) per kilowatt – the unit used on EU listings. */
export const HP_PER_KW = 1.36;

export type PowerUnit = 'kW' | 'HP';

/** Converts a power value in the given unit to whole kilowatts. */
export function toKw(value: number, unit: PowerUnit): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Invalid power value: ${value}`);
  }
  return unit === 'HP' ? Math.round(value / HP_PER_KW) : Math.round(value);
}

/** Drops keys whose value is '', null or undefined and stringifies the rest. */
export function cleanParams(form: Record<string, unknown>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(form)) {
    if (value === '' || value === null || value === undefined) continue;
    cleaned[key] = String(value);
  }
  return cleaned;
}

/**
 * Builds the query parameters sent to /api/{type}s.
 *
 * - empty fields are omitted
 * - yearFrom is also sent as first_registration
 * - powerFrom / powerTo (in powerUnit) are converted to engineKwFrom / engineKwTo in kW;
 *   the UI-only keys powerFrom, powerTo and powerUnit are not sent
 * - non-numeric power values are ignored rather than sent as NaN
 */
export function buildSearchParams(form: Record<string, unknown>): Record<string, string> {
  const params = cleanParams(form);
  const unit: PowerUnit = params.powerUnit === 'HP' ? 'HP' : 'kW';

  if (params.yearFrom) params.first_registration = params.yearFrom;

  const powerMap: Array<[string, string]> = [
    ['powerFrom', 'engineKwFrom'],
    ['powerTo', 'engineKwTo'],
  ];
  for (const [from, to] of powerMap) {
    if (params[from] !== undefined) {
      const n = Number(params[from]);
      if (Number.isFinite(n)) params[to] = String(toKw(n, unit));
      delete params[from];
    }
  }
  delete params.powerUnit;

  return params;
}

export function buildSearchQuery(form: Record<string, unknown>): string {
  return new URLSearchParams(buildSearchParams(form)).toString();
}
