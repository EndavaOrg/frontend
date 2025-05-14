import { useState } from 'react';
import type { CarListing, CarSearchParams } from '../types/car';
import SearchForm from '../components/SearchForm';
import CarCard from '../components/CarCard';
import { fetchCars } from '../services/api';

export default function Home() {
    const [results, setResults] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (params: CarSearchParams) => {
        setLoading(true);
        const cars = await fetchCars(params);
        setResults(cars);
        setLoading(false);
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <h1 className="text-center mb-5">Primerjalnik cen avtomobilov</h1>
                    <SearchForm onSearch={handleSearch} />
                </div>
            </div>

            <div className="row justify-content-center mt-5">
                <div className="col-lg-10">
                    {loading && <p className="text-center text-muted">Nalagam rezultate...</p>}

                    {!loading && results.length > 0 && (
                        <div className="row">
                            {results.map((car) => (
                                <div key={car.id} className="col-md-4 mb-4">
                                    <CarCard car={car} />
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && results.length === 0 && (
                        <p className="text-center text-muted">Ni rezultatov za izbrane parametre.</p>
                    )}
                </div>
            </div>
        </div>
    );
}  