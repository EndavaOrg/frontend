/**
 * Input validation for registration (phone) and vehicle preferences.
 */

export const PHONE_ERROR = 'Vnesi veljavno telefonsko številko (6–15 števk)';

/**
 * A phone number is valid when, after removing spaces, dashes, dots and slashes,
 * it is an optional leading '+' followed by 6–15 digits.
 * Returns '' when valid, otherwise the error message.
 */
export function validatePhone(raw: string): string {
  const compact = (raw ?? '').replace(/[\s\-./]/g, '');
  return /^\+?\d{6,15}$/.test(compact) ? '' : PHONE_ERROR;
}

export interface Preference {
  make: string;
  model: string;
  first_registration?: number | '';
  mileage_km?: number | '';
  price_eur?: number | '';
  fuel_type?: string;
  gearbox?: string;
  engine_ccm?: number | '';
  engine_kw?: number | '';
  engine_hp?: number | '';
  battery_kwh?: number | '';
}

export const NUMERIC_PREFERENCE_FIELDS = [
  'first_registration', 'mileage_km', 'price_eur',
  'engine_ccm', 'engine_kw', 'engine_hp', 'battery_kwh',
] as const;

/** Converts a raw input value: numeric fields become numbers ('' stays ''), others stay strings. */
export function parsePreferenceField(name: string, value: string): string | number {
  if (!(NUMERIC_PREFERENCE_FIELDS as readonly string[]).includes(name)) return value;
  if (value.trim() === '') return '';
  return Number(value);
}

/** Removes empty ('' / undefined / null) fields. */
export function cleanPreference(pref: Preference): Partial<Preference> {
  return Object.fromEntries(
    Object.entries(pref).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  ) as Partial<Preference>;
}

/**
 * Returns a list of error messages; an empty list means the preference can be saved.
 * Rules: at least make or model; numeric fields must be finite and non-negative;
 * first_registration must be a whole year between 1900 and the current year.
 */
export function validatePreference(pref: Partial<Preference>, now: Date = new Date()): string[] {
  const errors: string[] = [];
  if (!pref.make?.trim() && !pref.model?.trim()) {
    errors.push('Vnesi vsaj znamko ali model.');
  }

  for (const field of NUMERIC_PREFERENCE_FIELDS) {
    const v = pref[field];
    if (v === undefined || v === '') continue;
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      errors.push(`${field}: ni veljavno število.`);
    } else if (v < 0) {
      errors.push(`${field}: ne sme biti negativno.`);
    }
  }

  const year = pref.first_registration;
  if (typeof year === 'number' && Number.isFinite(year)) {
    const maxYear = now.getFullYear();
    if (!Number.isInteger(year) || year < 1900 || year > maxYear) {
      errors.push(`first_registration: letnik mora biti med 1900 in ${maxYear}.`);
    }
  }
  return errors;
}
