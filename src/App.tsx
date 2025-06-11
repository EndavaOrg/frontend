import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Results from './pages/Results';
import Watchlist from './pages/Watchlist';
import CarPreferencesForm from './pages/CarPreferences';

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, [auth]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <header className="bg-dark text-white py-3 shadow-sm">
        <div className="container d-flex justify-content-between align-items-center">
          <Link to="/" className="btn btn-outline-light" title="Home">
            <h1 className="h4 m-0">AvtoPrimerjalnik</h1>
          </Link>

          <div className="d-flex align-items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/watchlist"
                  className="btn btn-outline-warning"
                  title="Watchlist"
                >
                  ⭐
                </Link>

                <Link
                  to="/preferences"
                  className="btn btn-outline-light"
                  title="Preferences"
                >
                  ⚙ Preferences
                </Link>

                <button
                  className="btn btn-outline-light"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light">
                  Login
                </Link>
                <Link to="/register" className="btn btn-outline-light">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/preferences" element={<CarPreferencesForm />} />
          <Route path="/results" element={<Results />} />
          <Route path="/watchlist" element={<Watchlist />} />
        </Routes>
      </main>

      <footer className="bg-dark text-white text-center py-4 mt-5">
        <div className="container">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} AvtoPrimerjalnik. Vse pravice
            pridržane.
          </p>
        </div>
      </footer>
    </>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}