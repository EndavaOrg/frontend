import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CarListing } from '../types/car';

export default function Results() {
  const [results, setResults] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'none' | 'price-asc' | 'price-desc' | 'mileage-asc' | 'mileage-desc'>('none');
  const navigate = useNavigate();

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const rawParams = localStorage.getItem('searchParams');
    const type = localStorage.getItem('searchType') || 'car';
    if (!rawParams) {
      setLoading(false);
      return;
    }

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
      setResults([]); 
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchResults();
  }, [fetchResults]); 

  const sortedResults = [...results].sort((a, b) => {
    switch (sortOrder) {
      case 'price-asc':
        return (a.price_eur || 0) - (b.price_eur || 0);
      case 'price-desc':
        return (b.price_eur || 0) - (a.price_eur || 0);
      case 'mileage-asc':
        return (a.mileage_km || 0) - (b.mileage_km || 0);
      case 'mileage-desc':
        return (b.mileage_km || 0) - (a.mileage_km || 0);
      default:
        return 0; 
    }
  });


  return (
    <div className="container py-5">
      <h2 className="fw-bold text-center mb-4">Rezultati iskanja</h2>

      <div className="mb-3 d-flex justify-content-between align-items-center" style={{ marginTop: '-10px' }}>
        <button
          className="btn btn-link text-decoration-none px-0 fw-medium"
          style={{ color: '#495057' }}
          onClick={() => navigate('/')}
        >
          ← Nazaj na iskalnik
        </button>

        {/* Combined Sorting Control */}
        <div className="form-group">
          <label htmlFor="sortCombined" className="form-label visually-hidden">Sortiraj</label>
          <select
            id="sortCombined"
            className="form-select form-select-sm shadow-sm"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
          >
            <option value="none">Sortiraj</option>
            <option value="price-asc">Cena: Najnižja najprej</option>
            <option value="price-desc">Cena: Najvišja najprej</option>
            <option value="mileage-asc">Kilometri: Najmanj najprej</option>
            <option value="mileage-desc">Kilometri: Največ najprej</option>
          </select>
        </div>
      </div>


      {loading ? (
        <p className="text-center">Nalagam...</p>
      ) : sortedResults.length === 0 ? (
        <p className="text-center text-muted">Ni rezultatov za podane kriterije.</p>
      ) : (
        <div className="row">
          {sortedResults.map((item: any) => { // Use sortedResults here
            const isMotorcycle = !item.fuel_type && !item.gearbox;

            return (
              <div key={item._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <img
                    src={item.image_url || 'https://placehold.co/400x200/cccccc/333333?text=Ni+slike'} // Placeholder for missing image
                    className="card-img-top"
                    alt={`${item.make} ${item.model}`}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e) => { // Fallback for broken images
                      e.currentTarget.src = 'https://placehold.co/400x200/cccccc/333333?text=Ni+slike';
                    }}
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