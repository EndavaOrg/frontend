import { useNavigate } from 'react-router-dom';
import SearchForm from '../components/SearchForm';

export default function Home() {
  const navigate = useNavigate();

  const handleSearch = (params: any) => {
    localStorage.setItem('searchParams', JSON.stringify(params));
    navigate('/results');
  };

  return (
    <div className="container-fluid px-0">
      {/* Hero section + sidebar + search form */}
      <section className="hero-section text-white text-center d-flex align-items-center justify-content-center">
        <div className="overlay"></div>
        <div className="content">
          <h1 className="display-4 fw-bold">Najdi svoj naslednji avto</h1>
          <p className="lead">Primerjaj cene, lastnosti in pogoje prodaje iz različnih virov.</p>
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
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </div>
    </div>
  );
}
