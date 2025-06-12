import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Car, Motorcycle, Truck, Vehicle } from '../types/car';
import { getAuth } from 'firebase/auth';

type SortOrder = 'none' | 'price-asc' | 'price-desc' | 'mileage-asc' | 'mileage-desc';
type VehicleType = Car | Motorcycle | Truck | Vehicle;

export default function Results() {
  const [results, setResults] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const ITEMS_PER_PAGE = 20; 

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

    const rawAiResults = localStorage.getItem('aiResults');

    if (rawAiResults) {
      try {
        const parsed = JSON.parse(rawAiResults);
        const resultsArray = Array.isArray(parsed) ? parsed : [parsed];
        console.log("✅ AI Results from localStorage:", resultsArray);
        setResults(resultsArray);

        setTimeout(() => {
          localStorage.removeItem('aiResults');
          localStorage.removeItem('searchParams');
        }, 1000);
      } catch (err) {
        console.error("❌ Failed to parse aiResults from localStorage", err);
        setResults([]);
      }
      setLoading(false);
      return;
    }

    const rawParams = localStorage.getItem('searchParams');
    const type = localStorage.getItem('searchType') || 'car';

    if (!rawParams) {
      setLoading(false);
      return;
    }

    const parsedParams = JSON.parse(rawParams);
    const cleanedParams: Record<string, string> = {};

    for (const key in parsedParams) {
      const value = parsedParams[key];
      if (value !== '' && value !== null && value !== undefined) {
        cleanedParams[key] = value;
      }
    }

    const query = new URLSearchParams(cleanedParams).toString();

    try {
      const response = await fetch(`${API_BASE_URL}/api/${type}s?${query}`);
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
        return (a.price_eur ?? 0) - (b.price_eur ?? 0);
      case 'price-desc':
        return (b.price_eur ?? 0) - (a.price_eur ?? 0);
      case 'mileage-asc':
        return (a.mileage_km ?? 0) - (b.mileage_km ?? 0);
      case 'mileage-desc':
        return (b.mileage_km ?? 0) - (a.mileage_km ?? 0);
      default:
        return 0;
    }
  });

  const handleAddToWatchlist = (item: VehicleType) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      alert('Za dodajanje na seznam spremljanja se prijavite.');
      return;
    }

    const watchlistKey = `watchlist-${user.uid}`;
    const existing = JSON.parse(localStorage.getItem(watchlistKey) || '[]');
    const exists = existing.some((x: any) => x._id === (item as any)._id);
    if (!exists) {
      existing.push(item);
      localStorage.setItem(watchlistKey, JSON.stringify(existing));
      alert('Dodano na seznam spremljanja!');
    } else {
      alert('To vozilo je že na seznamu spremljanja.');
    }
  };

  const isCar = (v: VehicleType): v is Car =>
    'fuel_type' in v && 'gearbox' in v && 'engine_kw' in v;

  const isMotorcycle = (v: VehicleType): v is Motorcycle =>
    !('fuel_type' in v) && !('gearbox' in v) && 'engine_kw' in v;

  const isTruck = (v: VehicleType): v is Truck =>
    'fuel_type' in v && 'gearbox' in v && 'first_registration' in v;

  const totalPages = Math.ceil(sortedResults.length / ITEMS_PER_PAGE);
  const paginatedResults = sortedResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

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

        <div className="form-group">
          <label htmlFor="sortCombined" className="form-label visually-hidden">Sortiraj</label>
          <select
            id="sortCombined"
            className="form-select form-select-sm shadow-sm"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
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
      ) : paginatedResults.length === 0 ? (
        <p className="text-center text-muted">Ni rezultatov za podane kriterije.</p>
      ) : (
        <>
          <div className="row">
            {paginatedResults.map((item, index) => (
              <div key={(item as any)._id ?? `${item.make}-${item.model}-${index}`} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <img
                    src={item.image_url || 'https://placehold.co/400x200/cccccc/333333?text=Ni+slike'}
                    className="card-img-top"
                    alt={`${item.make} ${item.model}`}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/400x200/cccccc/333333?text=Ni+slike';
                    }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title d-flex justify-content-between align-items-center">
                      {item.make} {item.model}
                      <button
                        className="btn btn-sm btn-outline-warning ms-2"
                        title="Dodaj na seznam spremljanja"
                        onClick={() => handleAddToWatchlist(item)}
                      >
                        ⭐
                      </button>
                    </h5>
                    <ul className="list-unstyled text-muted small mb-3">
                      <li><strong>Letnik:</strong> {item.first_registration ?? (item as any).year ?? '—'}</li>
                      <li><strong>Kilometri:</strong> {item.mileage_km ? `${item.mileage_km.toLocaleString()} km` : '—'}</li>

                      {isCar(item) && (
                        <>
                          <li><strong>Gorivo:</strong> {item.fuel_type}</li>
                          <li><strong>Menjalnik:</strong> {item.gearbox}</li>
                          <li><strong>Moč:</strong> {item.engine_kw} kW{item.engine_hp ? ` (${item.engine_hp} HP)` : ''}</li>
                          {item.engine_ccm && <li><strong>Prostornina:</strong> {item.engine_ccm} ccm</li>}
                          {item.battery_kwh != null && (
                            <li><strong>Kapaciteta baterije:</strong> {item.battery_kwh} kWh</li>
                          )}
                        </>
                      )}

                      {isMotorcycle(item) && (
                        <>
                          <li><strong>Moč:</strong> {item.engine_kw} kW{item.engine_hp ? ` (${item.engine_hp} HP)` : ''}</li>
                          <li><strong>Stanje:</strong> {item.state ?? '—'}</li>
                        </>
                      )}

                      {isTruck(item) && (
                        <>
                          <li><strong>Letnik:</strong> {item.first_registration ?? '—'}</li>
                          <li><strong>Kilometri:</strong> {item.mileage_km ? `${item.mileage_km.toLocaleString()} km` : '—'}</li>
                          <li><strong>Gorivo:</strong> {item.fuel_type ?? '—'}</li>
                          <li><strong>Menjalnik:</strong> {item.gearbox ?? '—'}</li>
                          <li><strong>Moč:</strong> {item.engine_kw} kW{item.engine_hp ? ` (${item.engine_hp} HP)` : ''}</li>
                          {item.engine_ccm && <li><strong>Prostornina:</strong> {item.engine_ccm} ccm</li>}
                          <li><strong>Stanje:</strong> {item.state ?? '—'}</li>
                        </>
                      )}
                    </ul>
                    <h6 className="text-dark fw-bold mb-3">
                      {item.price_eur ? `${item.price_eur.toLocaleString()} €` : '—'}
                    </h6>
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
            ))}
          </div>

          <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
            <button
              className="btn btn-outline-secondary"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              ← Prejšnja
            </button>
            <span className="fw-medium">Stran {currentPage} / {totalPages}</span>
            <button
              className="btn btn-outline-secondary"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Naslednja →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
