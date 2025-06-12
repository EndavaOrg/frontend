import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "../util/firebaseAuth";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); 
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); 
  const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();

      const res = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }

      await res.json();

      setMessage("✅ Prijava uspešna!");
      navigate("/");
    } catch (error: any) {
      setMessage(`❌ Napaka: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setMessage("");
    setIsGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      const res = await fetch(`${API_BASE_URL}/api/users/loginWithGoogle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Google login failed");
      }

      await res.json();

      setMessage("✅ Google prijava uspešna!");
      navigate("/");
    } catch (error: any) {
      setMessage(`❌ Napaka pri Google prijavi: ${error.message}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center mb-4">Najava</h2>

        {message && (
          <div className="alert alert-info text-center py-2">{message}</div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email naslov</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Vnesi email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Geslo</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="Vnesi geslo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 mb-3" disabled={isLoading}>
            {isLoading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : null}
            Prijava
          </button>
        </form>

        <div className="text-center text-muted mb-3">ALI</div>

         <button
          onClick={handleGoogleLogin}
          className="btn btn-outline-danger w-100"
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          ) : (
            <i className="bi bi-google me-2"></i>
          )}
          Prijava z Google
        </button>
      </div>
    </div>
  );
};

export default Login;