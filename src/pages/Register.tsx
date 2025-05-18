import React, { useState } from "react";
import { auth } from "../util/firebaseAuth";
import { createUserWithEmailAndPassword } from "firebase/auth";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();

      const res = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registracija ni uspela");
      }

      const data = await res.json();
      setMessage(`✅ Registracija uspešna! ID: ${data.id}`);
    } catch (error: any) {
      setMessage(`❌ Napaka: ${error.message}`);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center mb-4">Registracija</h2>

        {message && (
          <div className="alert alert-info text-center py-2">{message}</div>
        )}

        <form onSubmit={handleRegister}>
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

          <button type="submit" className="btn btn-success w-100">
            Registriraj se
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
