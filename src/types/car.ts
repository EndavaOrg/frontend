export interface CarListing {
  _id: string;
  make: string;
  model: string;
  first_registration: number;
  mileage: number;
  fuel_type: string;
  shifter_type: string;
  engine_kw: number;
  price: number;
  link: string;
}

export interface CarSearchParams {
  make: string;
  model: string;
  yearFrom: string;
  mileageFrom: string;
  mileageTo: string;
  fuel_type: string;
  shifter_type: string;
  powerUnit: 'kW' | 'HP';
  powerFrom: string;
  powerTo: string;
  priceFrom: string;
  priceTo: string;
}

