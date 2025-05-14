import type { CarListing } from '../types/car';

export default function CarCard({ car }: { car: CarListing }) {
    return (
        <div className="card mb-3 shadow-sm">
            <div className="card-body">
                <h5 className="card-title">
                    {car.brand} {car.model} ({car.year})
                </h5>
                <p className="card-text mb-1">Motor: {car.engineSize}L</p>
                <p className="card-text mb-1">Kilometri: {car.mileage.toLocaleString()} km</p>
                <p className="card-text fw-bold">Cena: {car.price.toLocaleString()} €</p>
                <p className="card-text text-muted small">Vir: {car.source}</p>
                <a href={car.link} className="btn btn-outline-primary btn-sm mt-2" target="_blank" rel="noopener noreferrer">
                    Oglej si oglas
                </a>
            </div>
        </div>
    );
}