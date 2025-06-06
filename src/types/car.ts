export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  price_eur?: number | null;
  first_registration?: number; // idk why
  Year?: number; // check this 
  mileage_km?: number;
  state?: string;
  image_url?: string;
  link?: string;
}

export interface Car extends Vehicle {
  fuel_type: string;
  gearbox: string;
  engine_ccm?: number;
  engine_kw: number;
  engine_hp?: number;
  battery_kwh?: number | null;
}

export interface Motorcycle extends Vehicle {
  engine_kw: number;
  engine_hp?: number;
}

export interface Truck extends Vehicle {
  fuel_type: string;
  gearbox: string;
  first_registration: number;
  mileage_km?: number;
  engine_ccm?: number;
  engine_kw?: number;
  engine_hp?: number;
  state?: string;
}

