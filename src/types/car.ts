export interface CarListing {
  _id: string;
  make: string;
  model: string;
  first_registration: number;
  mileage_km: number;
  fuel_type: string;
  gearbox: string;
  engine_kw: number;
  engine_ccm?: number;
  battery?: number;
  price_eur: number;
  link?: string;
}


export interface CarSearchParams {
  make: string;
  model: string;
  yearFrom: string;
  mileageFrom: string;
  mileageTo: string;
  fuel_type: string;
  gearbox: string;
  powerUnit: 'kW' | 'HP';
  powerFrom: string;
  powerTo: string;
  priceFrom: string;
  priceTo: string;
}

