import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

type VehicleType = 'car' | 'motorcycle' | 'truck';

interface Preference {
  make: string;
  model: string;
  first_registration?: number | '';
  mileage_km?: number | '';
  price_eur?: number | '';
  fuel_type?: string;
  gearbox?: string;
  engine_ccm?: number | '';
  engine_kw?: number | '';
  engine_hp?: number | '';
  battery_kwh?: number | '';
}

const getEmptyPreference = (): Preference => ({
  make: '',
  model: '',
  first_registration: '',
  mileage_km: '',
  price_eur: '',
  fuel_type: '',
  gearbox: '',
  engine_ccm: '',
  engine_kw: '',
  engine_hp: '',
  battery_kwh: '',
});

const VehiclePreferencesForm: React.FC = () => {
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [currentPref, setCurrentPref] = useState<Preference>(getEmptyPreference());
  const [preferencesList, setPreferencesList] = useState<Preference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

  const years = Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => 1900 + i).reverse();

  const fetchPreferences = async (type: VehicleType) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.uid}/preferences/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPreferencesList(Array.isArray(data.preferences) ? data.preferences : []);
    } catch (err) {
      console.error(err);
      setPreferencesList([]);
    }
  };

  const fetchMakes = async (type: VehicleType) => {
    try {
      let response;
      if (type === 'car') {
        response = await axios.get(`${API_BASE_URL}/api/cars/carquery/makes`);
        const makesRaw = response.data?.Makes;
        if (makesRaw) {
          const makes = (makesRaw as any[]).map(m => m.make_display);
          setMakes([...new Set(makes)].sort());
        } else {
          setMakes([]);
        }
      } else if (type === 'motorcycle') {
        response = await axios.get(`${API_BASE_URL}/api/motorcycles/makes`);
        setMakes(response.data || []);
      } else if (type === 'truck') {
        response = await axios.get(`${API_BASE_URL}/api/trucks/makes`);
        setMakes(response.data.sort() || []);
      }
    } catch (err) {
      console.error('Failed to fetch makes:', err);
      setMakes([]);
    }
  };

  const fetchModels = async (type: VehicleType, make: string) => {
    if (!make) {
      setModels([]);
      return;
    }

    try {
      let response;
      if (type === 'car') {
        response = await axios.get(`${API_BASE_URL}/api/cars/carquery/models?make=${make.toLowerCase()}`);
        const modelsRaw = response.data?.Models;
        if (modelsRaw) {
          const models = (modelsRaw as any[]).map(m => m.model_name);
          setModels([...new Set(models)].sort());
        } else {
          setModels([]);
        }
      } else if (type === 'motorcycle') {
        response = await axios.get(`${API_BASE_URL}/api/motorcycles/models?make=${make}`);
        setModels(response.data || []);
      } else if (type === 'truck') {
        response = await axios.get(`${API_BASE_URL}/api/trucks/models?make=${make}`);
        setModels(response.data.sort() || []);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setModels([]);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        fetchPreferences(vehicleType);
      }
    });

    return () => unsubscribe();
  }, [vehicleType]);

  useEffect(() => {
    fetchPreferences(vehicleType);
    fetchMakes(vehicleType);
    setCurrentPref(getEmptyPreference());
    setModels([]);
  }, [vehicleType]);

  useEffect(() => {
    fetchModels(vehicleType, currentPref.make);
  }, [currentPref.make, vehicleType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = [
      'first_registration', 'mileage_km', 'price_eur',
      'engine_ccm', 'engine_kw', 'engine_hp', 'battery_kwh'
    ];
    const parsedValue = numericFields.includes(name)
      ? value === '' ? '' : Number(value)
      : value;

    setCurrentPref(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleAddPreference = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return alert('Uporabnik ni prijavljen.');

    const token = await user.getIdToken();

    const cleaned = Object.fromEntries(
      Object.entries(currentPref).filter(([_, val]) => val !== '')
    ) as Preference;

    if (!cleaned.make && !cleaned.model) {
      return alert('Vnesi vsaj znamko ali model.');
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.uid}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vehicleType, preferences: [cleaned] }),
      });

      if (!res.ok) throw new Error('Shranjevanje ni uspelo');

      setPreferencesList(prev => [...prev, cleaned]);
      setCurrentPref(getEmptyPreference());
    } catch (err) {
      console.error(err);
      alert('Napaka pri shranjevanju.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePreference = async (index: number) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.uid}/preferences/${vehicleType}/${index}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Brisanje ni uspelo');

      setPreferencesList(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error(err);
      alert('Napaka pri brisanju preference.');
    }
  };

  const handleVehicleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVehicleType(e.target.value as VehicleType);
  };

  const skip = () => navigate('/');

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between mb-4">
        <h3>Tvoje preference za vozila</h3>
        <button className="btn btn-secondary" onClick={skip}>Preskoči</button>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="mb-3">
            <label>Tip vozila</label>
            <select className="form-select" value={vehicleType} onChange={handleVehicleTypeChange}>
              <option value="car">Avtomobil</option>
              <option value="motorcycle">Motor</option>
              <option value="truck">Tovornjak</option>
            </select>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label>Znamka</label>
              <select name="make" className="form-select" value={currentPref.make} onChange={handleChange}>
                <option value="">Izberi znamko</option>
                {makes.map(make => <option key={make} value={make}>{make}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label>Model</label>
              <select name="model" className="form-select" value={currentPref.model} onChange={handleChange}>
                <option value="">Izberi model</option>
                {models.map(model => <option key={model} value={model}>{model}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label>Letnik od</label>
              <select name="first_registration" className="form-select" value={currentPref.first_registration || ''} onChange={handleChange}>
                <option value="">Poljubno</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Keep other fields unchanged */}
            <div className="col-md-4">
              <label>Prevoženi km (max)</label>
              <input type="number" name="mileage_km" className="form-control" value={currentPref.mileage_km || ''} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label>Cena max (€)</label>
              <input type="number" name="price_eur" className="form-control" value={currentPref.price_eur || ''} onChange={handleChange} />
            </div>

            <div className="col-12 text-end">
              <button type="button" onClick={handleAddPreference} className="btn btn-success" disabled={isLoading}>
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : '➕'} Dodaj preference
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="border p-3 bg-white rounded shadow-sm">
            <h5 className="mb-3">Shranjene preference</h5>
            {preferencesList.length === 0 ? (
              <p className="text-muted">Ni dodanih preferenc.</p>
            ) : (
              <ul className="list-group">
                {preferencesList.map((pref, idx) => (
                  <li key={idx} className="list-group-item small d-flex justify-content-between align-items-center">
                    <span><strong>{pref.make}</strong> {pref.model} ({pref.first_registration || '—'})</span>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeletePreference(idx)}>🗑️</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiclePreferencesForm;
