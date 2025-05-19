import SearchForm from '../components/SearchForm';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export default function Home() {
  const handleSearch = (params: any) => {
    localStorage.setItem('searchParams', JSON.stringify(params));
  };

  return (
    <div className="container-fluid px-0">
      <section className="hero-section text-white text-center d-flex align-items-center justify-content-center">
        <div className="overlay"></div>
        <div className="content">
          <h1 className="display-4 fw-bold">Najdi svoj naslednji avto</h1>
          <p className="lead">Primerjaj cene, lastnosti in pogoje prodaje iz različnih virov.</p>
        </div>
      </section>

      <div className="container py-5">
        <div className="row">
          {/* Sidebar */}
          <div className="col-lg-3 mb-4">
            <aside className="card shadow-sm p-4">
              <h5 className="fw-bold mb-4 text-dark">Kaj pridobiš z uporabo?</h5>
              <ul className="list-unstyled small text-muted">
                <li className="mb-3">✔️ Preveri najnovejše modele in cene</li>
                <li className="mb-3">✔️ Dostop do preverjenih prodajalcev</li>
                <li className="mb-3">✔️ Podrobne specifikacije in oprema</li>
                <li className="mb-3">✔️ Lokacije in kontakti prodajnih mest</li>
                <li className="mb-3">✔️ Sledenje cenam in priljubljenosti</li>
              </ul>
            </aside>
          </div>

          {/* Search Form */}
          <div className="col-lg-9">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </div>

    
      {/* <section className="container pb-5">
        <h2 className="text-center fw-bold mb-4 text-primary">Najbolj iskani</h2>
        <Slider {...sliderSettings}>
          {featuredCars.map((car) => (
            <div key={car.id} className="px-3">
              <div className="card h-100 shadow border-0">
                <img src={car.image} alt={car.name} className="card-img-top" style={{ height: '200px', objectFit: 'cover' }} />
                <div className="card-body">
                  <h5 className="card-title fw-bold">{car.name}</h5>
                  <p className="card-text text-muted mb-1">{car.price}</p>
                  <p className="card-text text-muted mb-1">{car.mileage}</p>
                  <p className="card-text text-muted">📍 {car.location}</p>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </section> */}
    </div>
  );
}
