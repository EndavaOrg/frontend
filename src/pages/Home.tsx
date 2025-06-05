import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SearchForm from '../components/SearchForm';
import MotorcycleSearchForm from '../components/MotorcycleSearchForm';
import TruckSearchForm from '../components/TruckSearchForm';
import axios from 'axios';

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'car' | 'motorcycle' | 'truck'>('car');
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

  const handleSearch = (params: any, type: 'car' | 'motorcycle' | 'truck' = 'car') => {
    localStorage.setItem('searchParams', JSON.stringify(params));
    localStorage.setItem('searchType', type);
    navigate('/results');
  };

  const handleAiSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!aiQuery.trim()) return;

  try {
    setAiLoading(true);
    const response = await axios.post(`${API_BASE_URL}/api/ai/search`, {
      prompt: aiQuery.trim(),
    });

    const results = response.data;

    if (results && results.length > 0) {
      localStorage.setItem('aiResults', JSON.stringify(results));
      localStorage.setItem('searchType', 'car'); // AI always returns cars
      navigate('/results');
    } else {
      alert("Ni rezultatov.");
    }
  } catch (error) {
    console.error('AI search failed:', error);
    alert("Napaka pri AI iskanju.");
  } finally {
    setAiLoading(false);
  }
};


  return (
    <div className="container-fluid px-0">
      <section className="hero-section text-white text-center d-flex align-items-center justify-content-center">
        <div className="overlay"></div>
        <div className="content">
          <h1 className="display-4 fw-bold">Najdite vozilo svojih sanj</h1>
          <p className="lead">Primerjaj cene avtomobilov, motorjev in tovornjakov z enega mesta.</p>

          {/* 🧠 AI Search Bar */}
          <form onSubmit={handleAiSearch} className="d-flex justify-content-center mt-4 px-2">
            <input
              type="text"
              className="form-control w-75 shadow-sm"
              placeholder="ex. I'm looking for a electric car under 20,000€"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
            />
            <button className="btn btn-light ms-2" disabled={aiLoading}>
              {aiLoading ? 'Iskanje...' : '🧠 Išči z AI'}
            </button>
          </form>
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
                <button
                  className={`btn btn-outline-dark px-4 py-2 fw-bold ${activeTab === 'truck' ? 'active' : ''}`}
                  onClick={() => setActiveTab('truck')}
                >
                  🚚 Tovornjaki
                </button>
              </div>

              {activeTab === 'car' && <SearchForm onSearch={(params) => handleSearch(params, 'car')} />}
              {activeTab === 'motorcycle' && <MotorcycleSearchForm onSearch={(params) => handleSearch(params, 'motorcycle')} />}
              {activeTab === 'truck' && <TruckSearchForm onSearch={(params) => handleSearch(params, 'truck')} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
