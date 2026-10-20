/**
 * "Zanimivo zate" recommendations on the Home page.
 */
import axios from 'axios';

export type VehicleTypeName = 'car' | 'motorcycle' | 'truck';

export interface RecommendationPreference {
  make?: string;
  model?: string;
  first_registration?: number;
  mileage_km?: number;
  price_eur?: number;
  fuel_type?: string;
  gearbox?: string;
  _vehicleType?: VehicleTypeName;
}

export interface Listing {
  _id: string;
  [key: string]: unknown;
}

export const MAX_RECOMMENDATIONS = 12;

/** Maps a saved preference onto backend filter parameters (only fields that are set). */
export function buildPreferenceParams(pref: RecommendationPreference): Record<string, string> {
  const p: Record<string, string> = {};
  if (pref.make) p.make = pref.make;
  if (pref.model) p.model = pref.model;
  if (pref.fuel_type) p.fuel_type = pref.fuel_type;
  if (pref.gearbox) p.gearbox = pref.gearbox;
  if (pref.first_registration) p.first_registration_gte = String(pref.first_registration);
  if (pref.mileage_km) p.mileage_km_lte = String(pref.mileage_km);
  if (pref.price_eur) p.price_eur_lte = String(pref.price_eur);
  return p;
}

async function fetchOne(baseUrl: string, type: VehicleTypeName, params: Record<string, string>): Promise<Listing[]> {
  const qs = new URLSearchParams({ limit: '1', ...params }).toString();
  const res = await axios.get(`${baseUrl}/api/${type}s?${qs}`);
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * For every preference: try all its filters, then only its make, then any listing of
 * that vehicle type – the first non-empty answer wins. A preference whose requests fail
 * is skipped. Results are de-duplicated by _id, topped up with the newest cars and
 * capped at MAX_RECOMMENDATIONS. Never throws.
 */
export async function fetchRecommendations(
  baseUrl: string,
  preferences: RecommendationPreference[] = [],
): Promise<Listing[]> {
  const out: Listing[] = [];
  const add = (item: Listing) => {
    if (out.length < MAX_RECOMMENDATIONS && item && !out.some((x) => x._id === item._id)) out.push(item);
  };

  for (const pref of preferences) {
    if (out.length >= MAX_RECOMMENDATIONS) break;
    const type = pref._vehicleType ?? 'car';
    const attempts: Record<string, string>[] = [buildPreferenceParams(pref)];
    if (pref.make) attempts.push({ make: pref.make });
    attempts.push({});

    try {
      for (const params of attempts) {
        const found = await fetchOne(baseUrl, type, params);
        if (found.length > 0) {
          found.forEach(add);
          break;
        }
      }
    } catch (err) {
      console.error(`Recommendation lookup failed for ${type}:`, err);
    }
  }

  if (out.length < MAX_RECOMMENDATIONS) {
    try {
      const res = await axios.get(`${baseUrl}/api/cars?limit=${MAX_RECOMMENDATIONS}&sort=-_id`);
      (Array.isArray(res.data) ? res.data : []).forEach(add);
    } catch (err) {
      console.error('Fetching latest cars failed:', err);
    }
  }
  return out;
}
