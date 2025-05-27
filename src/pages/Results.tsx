import { useEffect, useState } from 'react';
import type { CarListing } from '../types/car';

export default function Results() {
  const [results, setResults] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const rawParams = localStorage.getItem('searchParams');
      if (!rawParams) return;

      const parsed = JSON.parse(rawParams);
      const cleanedParams: Record<string, string> = {};

      for (const key in parsed) {
        const value = parsed[key];
        if (value !== '' && value !== null && value !== undefined) {
          cleanedParams[key] = value;
        }
      }

      const query = new URLSearchParams(cleanedParams).toString();

      try {
        const response = await fetch(`https://backend-ubd7.onrender.com/api/cars?${query}`);
        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error('Error fetching filtered cars:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="container py-5">
      <h2 className="fw-bold text-center mb-4">Rezultati iskanja</h2>
      {loading ? (
        <p className="text-center">Nalagam...</p>
      ) : results.length === 0 ? (
        <p className="text-center text-muted">Ni rezultatov za podane kriterije.</p>
      ) : (
        <div className="row">
          {results.map(car => (
            <div key={car._id} className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{car.make} {car.model}</h5>
                  <ul className="list-unstyled small">
                    <li>Letnik: {car.first_registration}</li>
                    <li>Kilometri: {car.mileage?.toLocaleString()} km</li>
                    <li>Gorivo: {car.fuel_type}</li>
                    <li>Menjalnik:&nbsp; 
                        {car.gearbox 
                            || (car.gearbox?.toLowerCase().includes('avtomatski') ? 'Automatic'
                            : car.gearbox?.toLowerCase().includes('ročni') ? 'Manual'
                            : car.gearbox || '—')}
                    </li>

                    {!car.fuel_type?.toLowerCase().includes('elektro') && (
                    <>
                        {car.engine_kw && <li>Moč: {car.engine_kw} kW</li>}
                        {car.engine_ccm && <li>Prostornina: {car.engine_ccm} cm³</li>}
                    </>
                    )}

                    {car.battery && <li>Baterija: {car.battery} kWh</li>}
                    <li>Cena: {car.price?.toLocaleString()} €</li>
                  </ul>
                  {car.link && (
                    <a href={car.link} target="_blank" rel="noreferrer" className="btn btn-primary w-100">
                      Poglej oglas
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
