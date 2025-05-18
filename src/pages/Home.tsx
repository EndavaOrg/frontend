import SearchForm from '../components/SearchForm';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const featuredCars = [
  {
    id: 1,
    name: 'Volkswagen Golf 7',
    price: '12.990 €',
    mileage: '145.000 km',
    location: 'Ljubljana',
    image: 'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-604019_960_720.jpg'
  },
  {
    id: 2,
    name: 'BMW 320d xDrive',
    price: '18.500 €',
    mileage: '98.000 km',
    location: 'Maribor',
    image: 'https://cdn.pixabay.com/photo/2016/04/01/11/30/bmw-1301853_960_720.jpg'
  },
  {
    id: 3,
    name: 'Audi A4 Avant',
    price: '21.750 €',
    mileage: '87.000 km',
    location: 'Celje',
    image: 'https://cdn.pixabay.com/photo/2015/01/19/13/51/car-604019_960_720.jpg'
  },
  {
    id: 4,
    name: 'Škoda Octavia RS',
    price: '17.999 €',
    mileage: '120.000 km',
    location: 'Kranj',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Skoda_Octavia_RS_2.0_TSI_%282019%29_IMG_2620.jpg/640px-Skoda_Octavia_RS_2.0_TSI_%282019%29_IMG_2620.jpg'
  },
  {
    id: 5,
    name: 'Mercedes C200',
    price: '25.300 €',
    mileage: '63.000 km',
    location: 'Nova Gorica',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/2018_Mercedes-Benz_C200_Avantgarde_Automatic_2.0_Front.jpg/640px-2018_Mercedes-Benz_C200_Avantgarde_Automatic_2.0_Front.jpg'
  }
];



const PrevArrow = (props: any) => (
  <button {...props} className="slick-prev slick-arrow" aria-label="Previous">
    <FaArrowLeft />
  </button>
);

const NextArrow = (props: any) => (
  <button {...props} className="slick-next slick-arrow" aria-label="Next">
    <FaArrowRight />
  </button>
);

export default function Home() {
  const handleSearch = (params: any) => {
    localStorage.setItem('searchParams', JSON.stringify(params));
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      { breakpoint: 992, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 1 } }
    ]
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
