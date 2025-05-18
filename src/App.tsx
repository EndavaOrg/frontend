import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
// import Results from './pages/Results';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Register from './pages/Register';
import Login from './pages/Login';


function App() {
  return (
    <Router>
      <div>
        <header className="bg-dark text-white py-3 shadow-sm">
  <div className="container d-flex justify-content-between align-items-center">
    <h1 className="h4 m-0">AvtoPrimerjalnik</h1>

    <div className="dropdown">
      <button
        className="btn btn-outline-light dropdown-toggle"
        type="button"
        id="languageDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        🌐 Jezik
      </button>
      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="languageDropdown">
        <li><button className="dropdown-item">Slovenščina</button></li>
        <li><button className="dropdown-item">English</button></li>
        <li><button className="dropdown-item">Deutsch</button></li>
      </ul>
    </div>
  </div>
</header>

        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* <Route path="/results" element={<Results />} /> */}
          </Routes>
        </main>
        <footer className="bg-dark text-white text-center py-4 mt-5">
          <div className="container">
            <p className="mb-0">&copy; {new Date().getFullYear()} AvtoPrimerjalnik. Vse pravice pridržane.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;