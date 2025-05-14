export interface CarSearchParams {
    brand: string;
    model: string;
    yearFrom: number;
    yearTo: number;
    engineSize: number;
    mileage: number;
}

export interface CarListing {
    id: number;
    brand: string;
    model: string;
    year: number;
    engineSize: number;
    mileage: number;
    price: number;
    source: string;
    link: string;
}