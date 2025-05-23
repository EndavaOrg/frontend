import React, { useState } from 'react';
import { getAuth, type User } from "firebase/auth";

interface CarPreferences {
  make: string;
  model: string;
  maxPrice: number | '';
  minYear: number | '';
  maxMileage: number | '';
  fuelType: 'petrol' | 'diesel' | 'electric' | '';
  gearbox: 'manual' | 'automatic' | '';
  minEngineCCM: number | '';
  minEngineKW: number | '';
  batteryCapacity: number | ''; // For electric cars, optional
}

const CarPreferencesForm: React.FC = () => {
  const [preferences, setPreferences] = useState<CarPreferences>({
    make: '',
    model: '',
    maxPrice: '',
    minYear: '',
    maxMileage: '',
    fuelType: '',
    gearbox: '',
    minEngineCCM: '',
    minEngineKW: '',
    batteryCapacity: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsedValue = ['maxPrice', 'minYear', 'maxMileage', 'minEngineCCM', 'minEngineKW', 'batteryCapacity'].includes(name)
      ? value === '' ? '' : Number(value)
      : value;

    setPreferences((prev) => ({ ...prev, [name]: parsedValue }));
  };
  const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedPreferences = Object.fromEntries(
      Object.entries(preferences).filter(([_, value]) => value !== '')
    );

    console.log('Sending cleaned preferences:', cleanedPreferences);
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert("User is not logged in");
      return;
    }
    
    const token = await user.getIdToken();
    const userId = user?.uid; 
    try {
        const res = await fetch(`${API_BASE_URL}/api/users/${userId}/preferences`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ preferences: cleanedPreferences }),
          });
          
      if (!res.ok) throw new Error('Something went wrong');

      alert('Preference shranjene uspešno!');
    } catch (err) {
      console.error(err);
      alert('Napaka pri shranjevanju preferenc.');
    }
  };

  return (
    <div className="container my-5 p-4 bg-light rounded shadow-sm" style={{ maxWidth: 600 }}>
      <h3 className="mb-4">Izberi želje glede avtomobila</h3>
      <form onSubmit={handleSubmit}>
        {/* make */}
        <div className="mb-3">
          <label htmlFor="make" className="form-label">
            Znamka <small className="text-muted">(neobvezno)</small>
          </label>
          <input
            type="text"
            id="make"
            name="make"
            className="form-control"
            value={preferences.make}
            onChange={handleChange}
            placeholder="npr. Mercedes-Benz"
          />
        </div>

        {/* model */}
        <div className="mb-3">
          <label htmlFor="model" className="form-label">
            Model <small className="text-muted">(neobvezno)</small>
          </label>
          <input
            type="text"
            id="model"
            name="model"
            className="form-control"
            value={preferences.model}
            onChange={handleChange}
            placeholder="npr. V-Razred"
          />
        </div>

        {/* maxPrice */}
        <div className="mb-3">
          <label htmlFor="maxPrice" className="form-label">
            Maksimalna cena (€) <small className="text-muted">(neobvezno)</small>
          </label>
          <input
            type="number"
            id="maxPrice"
            name="maxPrice"
            className="form-control"
            value={preferences.maxPrice}
            onChange={handleChange}
            min={0}
            placeholder="npr. 60000"
          />
        </div>

        {/* minYear */}
        <div className="mb-3">
          <label htmlFor="minYear" className="form-label">
            Najzgodnejša letnica <small className="text-muted">(neobvezno)</small>
          </label>
          <input
            type="number"
            id="minYear"
            name="minYear"
            className="form-control"
            value={preferences.minYear}
            onChange={handleChange}
            min={1900}
            max={new Date().getFullYear()}
            placeholder="npr. 2015"
          />
        </div>

        {/* maxMileage */}
        <div className="mb-3">
          <label htmlFor="maxMileage" className="form-label">
            Največ km <small className="text-muted">(neobvezno)</small>
          </label>
          <input
            type="number"
            id="maxMileage"
            name="maxMileage"
            className="form-control"
            value={preferences.maxMileage}
            onChange={handleChange}
            min={0}
            placeholder="npr. 100000"
          />
        </div>

        {/* fuelType */}
        <div className="mb-3">
          <label htmlFor="fuelType" className="form-label">
            Gorivo <small className="text-muted">(neobvezno)</small>
          </label>
          <select
            id="fuelType"
            name="fuelType"
            className="form-select"
            value={preferences.fuelType}
            onChange={handleChange}
          >
            <option value="">Izberi...</option>
            <option value="petrol">Bencin</option>
            <option value="diesel">Dizel</option>
            <option value="electric">Električni</option>
          </select>
        </div>

        {/* gearbox */}
        <div className="mb-3">
          <label htmlFor="gearbox" className="form-label">
            Menjalnik <small className="text-muted">(neobvezno)</small>
          </label>
          <select
            id="gearbox"
            name="gearbox"
            className="form-select"
            value={preferences.gearbox}
            onChange={handleChange}
          >
            <option value="">Izberi...</option>
            <option value="manual">Ročni</option>
            <option value="automatic">Avtomatski</option>
          </select>
        </div>

        {/* minEngineCCM */}
        <div className="mb-3">
          <label htmlFor="minEngineCCM" className="form-label">
            Min. motor (ccm) <small className="text-muted">(neobvezno)</small>
          </label>
          <input
            type="number"
            id="minEngineCCM"
            name="minEngineCCM"
            className="form-control"
            value={preferences.minEngineCCM}
            onChange={handleChange}
            min={0}
            placeholder="npr. 1500"
          />
        </div>

        {/* minEngineKW */}
        <div className="mb-3">
          <label htmlFor="minEngineKW" className="form-label">
            Min. moč (kW) <small className="text-muted">(neobvezno)</small>
          </label>
          <input
            type="number"
            id="minEngineKW"
            name="minEngineKW"
            className="form-control"
            value={preferences.minEngineKW}
            onChange={handleChange}
            min={0}
            placeholder="npr. 100"
          />
        </div>

        {/* batteryCapacity */}
        <div className="mb-3">
          <label htmlFor="batteryCapacity" className="form-label">
            Kapaciteta baterije (kWh) <small className="text-muted">(samo če električni)</small>
          </label>
          <input
            type="number"
            id="batteryCapacity"
            name="batteryCapacity"
            className="form-control"
            value={preferences.batteryCapacity}
            onChange={handleChange}
            min={0}
            placeholder="npr. 75"
          />
        </div>

        <button type="submit" className="btn btn-success w-100">
          Potrdi preference
        </button>
      </form>
    </div>
  );
};

export default CarPreferencesForm;
