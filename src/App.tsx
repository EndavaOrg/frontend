import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import UsersList from './pages/UserList';

import { getAuth, onAuthStateChanged, signOut, type User } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, [auth]);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // по logout те префрла на login страница
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <header className="bg-dark text-white py-3 shadow-sm">
        <div className="container d-flex justify-content-between align-items-center">
          <h1 className="h4 m-0">AvtoPrimerjalnik</h1>

          <div className="d-flex align-items-center gap-2">
            {/* Language dropdown */}
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
              <ul
                className="dropdown-menu dropdown-menu-end"
                aria-labelledby="languageDropdown"
              >
                <li>
                  <button className="dropdown-item">Slovenščina</button>
                </li>
                <li>
                  <button className="dropdown-item">English</button>
                </li>
                <li>
                  <button className="dropdown-item">Deutsch</button>
                </li>
              </ul>
            </div>

            {/* Login/Logout button */}
            {user ? (
              <button
                className="btn btn-outline-light"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="btn btn-outline-light">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/userList" element={<UsersList />} /> 
        {/* Delete this userList it is for testing the auth token ty*/}

          {/* <Route path="/results" element={<Results />} /> */}
        </Routes>
      </main>

      <footer className="bg-dark text-white text-center py-4 mt-5">
        <div className="container">
          <p className="mb-0">&copy; {new Date().getFullYear()} AvtoPrimerjalnik. Vse pravice pridržane.</p>
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
