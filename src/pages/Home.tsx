import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SearchForm from '../components/SearchForm';
import MotorcycleSearchForm from '../components/MotorcycleSearchForm';

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'car' | 'motorcycle'>('car');

  const handleSearch = (params: any, type: 'car' | 'motorcycle' = 'car') => {
    localStorage.setItem('searchParams', JSON.stringify(params));
    localStorage.setItem('searchType', type);
    navigate('/results');
  };

  return (
    <div className="container-fluid px-0">
      {/* Hero section */}
      <section className="hero-section text-white text-center d-flex align-items-center justify-content-center">
        <div className="overlay"></div>
        <div className="content">
          <h1 className="display-4 fw-bold">Najdi svoje vozilo</h1>
          <p className="lead">Primerjaj cene avtomobilov in motorjev z enega mesta.</p>
        </div>
      </section>

      <div className="container py-5">
        <div className="row">
          <div className="col-lg-3 mb-4">
            <aside className="card shadow-sm p-4">
              <h5 className="fw-bold mb-4 text-dark">Kaj pridobiš z uporabo?</h5>
              <ul className="list-unstyled small text-muted">
                <li>✔️ Preveri najnovejše modele in cene</li>
                <li>✔️ Dostop do preverjenih prodajalcev</li>
                <li>✔️ Podrobne specifikacije in oprema</li>
                <li>✔️ Lokacije in kontakti prodajnih mest</li>
                <li>✔️ Sledenje cenam in priljubljenosti</li>
              </ul>
            </aside>
          </div>

          <div className="col-lg-9">
          <div className="card p-4 shadow-sm bg-white rounded-4">
            <div className="d-flex justify-content-center gap-3 mb-4">
              <button
                className={`btn btn-outline-dark px-4 py-2 fw-bold ${activeTab === 'car' ? 'active' : ''}`}
                onClick={() => setActiveTab('car')}
              >
                🚗 Avtomobili
              </button>
              <button
                className={`btn btn-outline-dark px-4 py-2 fw-bold ${activeTab === 'motorcycle' ? 'active' : ''}`}
                onClick={() => setActiveTab('motorcycle')}
              >
                🏍 Motorji
              </button>
            </div>

            {activeTab === 'car' ? (
              <SearchForm onSearch={(params) => handleSearch(params, 'car')} />
            ) : (
              <MotorcycleSearchForm onSearch={(params) => handleSearch(params, 'motorcycle')} />
            )}
          </div>
        </div>


        </div>
      </div>
    </div>
  );
}
