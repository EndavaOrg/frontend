/**
 * Sorting, pagination and vehicle classification used by the Results page.
 */
import type { Vehicle } from '../types/car';

export type SortOrder = 'none' | 'price-asc' | 'price-desc' | 'mileage-asc' | 'mileage-desc';
export type VehicleKind = 'car' | 'motorcycle' | 'truck' | 'unknown';

type SortField = 'price_eur' | 'mileage_km';

const SORTS: Record<Exclude<SortOrder, 'none'>, { field: SortField; dir: 1 | -1 }> = {
  'price-asc': { field: 'price_eur', dir: 1 },
  'price-desc': { field: 'price_eur', dir: -1 },
  'mileage-asc': { field: 'mileage_km', dir: 1 },
  'mileage-desc': { field: 'mileage_km', dir: -1 },
};

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Returns a new sorted array; the input is never mutated.
 * Listings without a value for the sort field always go last (in both directions),
 * so "price unknown" listings are not shown as the cheapest.
 * Equal values keep their original order.
 */
export function sortVehicles<T extends Partial<Vehicle>>(items: readonly T[], order: SortOrder): T[] {
  const copy = [...items];
  if (order === 'none') return copy;
  const spec = SORTS[order];
  if (!spec) return copy;

  return copy.sort((a, b) => {
    const av = a[spec.field];
    const bv = b[spec.field];
    const aOk = isNum(av);
    const bOk = isNum(bv);
    if (!aOk && !bOk) return 0;
    if (!aOk) return 1;
    if (!bOk) return -1;
    return (av - bv) * spec.dir;
  });
}

export interface Page<T> {
  items: T[];
  page: number;
  totalPages: number;
}

/**
 * Splits items into pages. totalPages is at least 1 (an empty list is "page 1 of 1"),
 * and the requested page is clamped into [1, totalPages].
 */
export function paginate<T>(items: readonly T[], page: number, perPage: number): Page<T> {
  if (!Number.isInteger(perPage) || perPage <= 0) {
    throw new RangeError(`perPage must be a positive integer, got ${perPage}`);
  }
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const requested = Number.isFinite(page) ? Math.floor(page) : 1;
  const current = Math.min(Math.max(requested, 1), totalPages);
  const start = (current - 1) * perPage;
  return { items: items.slice(start, start + perPage), page: current, totalPages };
}

/**
 * Decides which detail block a listing gets. Exactly one kind is returned.
 * The search type the user picked is authoritative; the shape of the object is
 * only used when the type is unknown (e.g. AI search results).
 */
export function classifyVehicle(item: object, searchType?: string | null): VehicleKind {
  if (searchType === 'car' || searchType === 'motorcycle' || searchType === 'truck') {
    return searchType;
  }
  const has = (k: string) => k in item;
  if (has('fuel_type') && has('gearbox')) return 'car';
  if (has('engine_kw')) return 'motorcycle';
  return 'unknown';
}
