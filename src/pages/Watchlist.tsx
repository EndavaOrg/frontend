import { useState, useEffect } from 'react';
import type { Vehicle } from '../types/car';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<Vehicle[]>([]);
  const navigate = useNavigate();

  const loadWatchlist = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setWatchlist([]);
      return;
    }

    const watchlistKey = `watchlist-${user.uid}`;
    const stored = localStorage.getItem(watchlistKey);
    if (stored) {
      setWatchlist(JSON.parse(stored));
    } else {
      setWatchlist([]);
    }
  };

  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged(() => {
      loadWatchlist();
    });

    loadWatchlist();

    return () => unsubscribe();
  }, []);

  const handleRemove = (id: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const watchlistKey = `watchlist-${user.uid}`;
    const updated = watchlist.filter((item: any) => item._id !== id);
    setWatchlist(updated);
    localStorage.setItem(watchlistKey, JSON.stringify(updated));
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold text-center mb-4">Seznam spremljanja</h2>

      <div className="mb-3 d-flex justify-content-start">
        <button
          className="btn btn-link text-decoration-none px-0 fw-medium"
          style={{ color: '#495057' }}
          onClick={() => navigate('/')}
        >
          ← Nazaj na iskalnik
        </button>
      </div>

      {watchlist.length === 0 ? (
        <p className="text-center text-muted">Seznam spremljanja je prazen.</p>
      ) : (
        <div className="row">
          {watchlist.map((item, index) => (
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
                  <h5 className="card-title">{item.make} {item.model}</h5>
                  <h6 className="text-dark fw-bold mb-3">
                    {item.price_eur ? `${item.price_eur.toLocaleString()} €` : '—'}
                  </h6>
                  <div className="d-flex justify-content-between mt-auto">
                    <a
                      href={item.link}
                      className="btn btn-outline-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ogled ponudbe
                    </a>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => handleRemove((item as any)._id)}
                    >
                      🗑 Odstrani
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
