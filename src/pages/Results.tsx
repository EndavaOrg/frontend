import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Car, Motorcycle, Truck, Vehicle } from '../types/car';
import { getAuth } from 'firebase/auth';
import { sortVehicles, paginate, classifyVehicle, type SortOrder } from '../utils/vehicleList';
import { cleanParams } from '../utils/searchQuery';

type VehicleType = Car | Motorcycle | Truck | Vehicle;

export default function Results() {
  const [results, setResults] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchType, setSearchType] = useState<string | null>(null);
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
        setSearchType(null); // AI results can be any vehicle type

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

    setSearchType(type);
    const query = new URLSearchParams(cleanParams(JSON.parse(rawParams))).toString();

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

  const sortedResults = sortVehicles(results, sortOrder);

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

  const isCar = (v: VehicleType): v is Car => classifyVehicle(v, searchType) === 'car';
  const isMotorcycle = (v: VehicleType): v is Motorcycle => classifyVehicle(v, searchType) === 'motorcycle';
  const isTruck = (v: VehicleType): v is Truck => classifyVehicle(v, searchType) === 'truck';

  const { items: paginatedResults, page: shownPage, totalPages } = paginate(sortedResults, currentPage, ITEMS_PER_PAGE);

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
            onChange={(e) => { setSortOrder(e.target.value as SortOrder); setCurrentPage(1); }}
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
              disabled={shownPage === 1}
            >
              ← Prejšnja
            </button>
            <span className="fw-medium">Stran {shownPage} / {totalPages}</span>
            <button
              className="btn btn-outline-secondary"
              onClick={handleNextPage}
              disabled={shownPage === totalPages}
            >
              Naslednja →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
