import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../util/firebaseAuth';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const RegisterForm: React.FC = () => {
  const [form, setForm] = useState({
    ime: '',
    priimek: '',
    telefon: '',
    email: '',
    geslo: '',
  });
  const navigate = useNavigate();

  const [errors, setErrors] = useState({
    telefon: '',
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const [message, setMessage] = useState('');
  const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'telefon') {
      const phoneRegex = /^[0-9]{6,15}$/;
      if (!phoneRegex.test(value)) {
        setErrors((prev) => ({ ...prev, telefon: 'Vnesi validen broj (6-15 cifri)' }));
      } else {
        setErrors((prev) => ({ ...prev, telefon: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (errors.telefon) {
      alert('Popravi brojot na telefon!');
      return;
    }

    try {
      // 1. Register user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.geslo);
      const user = userCredential.user;
      const token = await user.getIdToken();

      // 2. Send form data to backend
      const res = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ime: form.ime,
          priimek: form.priimek,
          telefon: form.telefon,
          email: form.email,
          token: token
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Napaka pri registraciji');
      }

      const data = await res.json();
      setMessage(`✅ Registracija uspešna! ID: ${data.id}`);
      navigate('/preferences');
    } catch (error: any) {
      setMessage(`❌ Napaka: ${error.message}`);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg p-4">
            <h2 className="text-center mb-4">Registracija</h2>

            {message && <div className="alert alert-info text-center">{message}</div>}

            <form onSubmit={handleSubmit}>
              {[
                { name: 'ime', label: 'Ime' },
                { name: 'priimek', label: 'Priimek' },
                { name: 'telefon', label: 'Telefonska številka' },
                { name: 'email', label: 'Email naslov', type: 'email' },
                { name: 'geslo', label: 'Geslo', type: 'password' },
              ].map(({ name, label, type = 'text' }) => (
                <div className="mb-3" key={name}>
                  <label htmlFor={name} className="form-label">{label}</label>
                  <input
                    type={type}
                    className={`form-control ${name === 'telefon' && errors.telefon ? 'is-invalid' : ''
                      }`}
                    id={name}
                    name={name}
                    placeholder={`Vnesi ${label.toLowerCase()}`}
                    value={(form as any)[name]}
                    onChange={handleChange}
                    required
                  />
                  {name === 'telefon' && errors.telefon && (
                    <div className="invalid-feedback">{errors.telefon}</div>
                  )}
                </div>
              ))}

              <button type="submit" className="btn btn-primary w-100 mt-3">
                Registriraj se!
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;