import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

  const [recommendedCars, setRecommendedCars] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const examplePrompts = [
    "I want an electric car newer than 2018",
    "I want a really old car",
    "I want a car that costs less than 10,000",
  ];

  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

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
        localStorage.setItem('searchType', 'car');
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

  useEffect(() => {
    const fetchRecommendedCars = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/cars?limit=12&sort=-_id`);
        setRecommendedCars(response.data.slice(0, 12));
      } catch (err) {
        console.error('Failed to fetch recommended cars:', err);
      }
    };

    fetchRecommendedCars();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.ceil(recommendedCars.length / 4));
    }, 4000); 

    return () => clearInterval(interval);
  }, [recommendedCars]);

  useEffect(() => {
    const currentPrompt = examplePrompts[currentExampleIndex];

    const typingInterval = setInterval(() => {
      setCharIndex((prevCharIndex) => {
        if (prevCharIndex < currentPrompt.length) {
          return prevCharIndex + 1;
        } else {
          setTimeout(() => {
            setCurrentExampleIndex((prevIndex) => (prevIndex + 1) % examplePrompts.length);
            setCharIndex(0);
          }, 2000); 
          clearInterval(typingInterval);
          return prevCharIndex;
        }
      });
    }, 50); 

    return () => clearInterval(typingInterval);
  }, [currentExampleIndex, charIndex, examplePrompts]);

  return (
    <div className="container-fluid px-0">
      <section className="hero-section text-white text-center d-flex align-items-center justify-content-center">
        <div className="overlay"></div>
        <div className="content">
          <h1 className="display-4 fw-bold">Najdite vozilo svojih sanj</h1>
          <p className="lead">Primerjaj cene avtomobilov, motorjev in tovornjakov z enega mesta.</p>

          <form onSubmit={handleAiSearch} className="ai-search-bar mt-4">
            <div className="ai-search-inner d-flex align-items-center">
              <input
                type="text"
                className="form-control flex-grow-1 shadow-none border-0 px-4 py-3"
                placeholder={examplePrompts[currentExampleIndex].substring(0, charIndex)}
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
              />
              <button className="btn btn-dark ms-3 px-5 py-3 fw-bold" disabled={aiLoading}>
                {aiLoading ? 'Iskanje...' : 'Išči'}
              </button>
            </div>
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

      {recommendedCars.length > 0 && (
        <section className="container mt-5 mb-5">
          <h4 className="fw-bold mb-4 text-dark text-left">Zanimivo zate</h4>
          <div className="row g-3">
            {recommendedCars
              .slice(currentSlide * 4, currentSlide * 4 + 4)
              .map((car) => (
                <div key={car._id} className="col-md-6 col-lg-3 animate-fade">
                  <div className="card h-100 shadow-sm">
                    <img
                      src={car.image_url || 'https://placehold.co/400x200?text=No+Image'}
                      className="card-img-top"
                      alt={`${car.make} ${car.model}`}
                      style={{ height: '160px', objectFit: 'cover' }}
                    />
                    <div className="card-body d-flex flex-column">
                      <h6 className="fw-bold text-dark">{car.make} {car.model}</h6>
                      <p className="text-muted small mb-2">
                        Letnik: {car.first_registration ?? '—'}<br />
                        Kilometri: {car.mileage_km ? `${car.mileage_km.toLocaleString()} km` : '—'}
                      </p>
                      <div className="mt-auto fw-bold text-primary">
                        {car.price_eur ? `${car.price_eur.toLocaleString()} €` : '—'}
                      </div>
                      <a
                        href={car.link}
                        className="btn btn-sm btn-outline-primary mt-2"
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
        </section>
      )}
    </div>
  );
}
