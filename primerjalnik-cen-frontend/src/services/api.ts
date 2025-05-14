import axios from 'axios';
import type { CarSearchParams, CarListing } from '../types/car';

export const fetchCars = async (params: CarSearchParams): Promise<CarListing[]> => {
    const response = await axios.get<CarListing[]>('http://localhost:3001/cars');
    return response.data.filter((car) =>
        car.brand.toLowerCase().includes(params.brand.toLowerCase()) &&
        car.model.toLowerCase().includes(params.model.toLowerCase()) &&
        car.year >= params.yearFrom &&
        car.year <= params.yearTo &&
        car.engineSize >= params.engineSize &&
        car.mileage <= params.mileage
    );
};