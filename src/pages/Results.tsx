import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CarListing } from '../types/car';

export default function Results() {
  const [results, setResults] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      const rawParams = localStorage.getItem('searchParams');
      const type = localStorage.getItem('searchType') || 'car';
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
        const response = await fetch(`https://backend-ubd7.onrender.com/api/${type}s?${query}`);
        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error('Error fetching filtered listings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="container py-5">
      <h2 className="fw-bold text-center mb-4">Rezultati iskanja</h2>

      <div className="mb-3" style={{ marginTop: '-10px' }}>
  <button
    className="btn btn-link text-decoration-none px-0 fw-medium"
    style={{ color: '#495057' }}
    onClick={() => navigate('/')}
  >
    ← Nazaj na iskalnik
  </button>
</div>


      {loading ? (
        <p className="text-center">Nalagam...</p>
      ) : results.length === 0 ? (
        <p className="text-center text-muted">Ni rezultatov za podane kriterije.</p>
      ) : (
        <div className="row">
          {results.map((item: any) => {
            const isMotorcycle = !item.fuel_type && !item.gearbox;

            return (
              <div key={item._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <img
                    src={item.image_url || '/default-bike.jpg'}
                    className="card-img-top"
                    alt={`${item.make} ${item.model}`}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{item.make} {item.model}</h5>
                    <ul className="list-unstyled text-muted small mb-3">
                      <li><strong>Letnik:</strong> {item.first_registration || '—'}</li>
                      <li><strong>Kilometri:</strong> {item.mileage_km ? `${item.mileage_km.toLocaleString()} km` : '—'}</li>
                      {isMotorcycle ? (
                        <>
                          <li><strong>Stanje:</strong> {item.state || '—'}</li>
                          <li><strong>Moč:</strong> {item.engine_kw ? `${item.engine_kw} kW (${item.engine_hp} HP)` : '—'}</li>
                        </>
                      ) : (
                        <>
                          <li><strong>Gorivo:</strong> {item.fuel_type || '—'}</li>
                          <li><strong>Menjalnik:</strong> {item.gearbox || '—'}</li>
                          <li><strong>Moč:</strong> {item.engine_kw ? `${item.engine_kw} kW (${item.engine_hp} HP)` : '—'}</li>
                          {item.engine_ccm && <li><strong>Prostornina:</strong> {item.engine_ccm} ccm</li>}
                        </>
                      )}
                    </ul>
                    <h6 className="text-dark fw-bold mb-3">{item.price_eur ? `${item.price_eur.toLocaleString()} €` : '—'}</h6>
                    <a
                      href={item.link}
                      className="btn btn-outline-primary mt-auto"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ogled ponudbe
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
