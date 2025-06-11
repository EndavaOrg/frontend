import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

// Define vehicle types
type VehicleType = 'car' | 'motorcycle' | 'truck';

// Define preference structure
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

// Initialize an empty preference
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
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

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

  // Load preferences on mount
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
  }, [vehicleType]);

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
    setCurrentPref(getEmptyPreference());
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
              <input name="make" className="form-control" value={currentPref.make} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label>Model</label>
              <input name="model" className="form-control" value={currentPref.model} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label>Letnik od</label>
              <input type="number" name="first_registration" className="form-control" value={currentPref.first_registration || ''} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label>Prevoženi km (max)</label>
              <input type="number" name="mileage_km" className="form-control" value={currentPref.mileage_km || ''} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label>Cena max (€)</label>
              <input type="number" name="price_eur" className="form-control" value={currentPref.price_eur || ''} onChange={handleChange} />
            </div>

            {['car', 'truck'].includes(vehicleType) && (
              <>
                <div className="col-md-6">
                  <label>Gorivo</label>
                  <select name="fuel_type" className="form-select" value={currentPref.fuel_type || ''} onChange={handleChange}>
                    <option value="">Izberi...</option>
                    <option value="petrol">Bencin</option>
                    <option value="diesel">Dizel</option>
                    <option value="electric">Elektrika</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label>Menjalnik</label>
                  <select name="gearbox" className="form-select" value={currentPref.gearbox || ''} onChange={handleChange}>
                    <option value="">Izberi...</option>
                    <option value="manual">Ročni</option>
                    <option value="automatic">Avtomatski</option>
                  </select>
                </div>
              </>
            )}

            {vehicleType === 'car' && (
              <>
                <div className="col-md-4">
                  <label>Motor (ccm)</label>
                  <input type="number" name="engine_ccm" className="form-control" value={currentPref.engine_ccm || ''} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label>Moč (kW)</label>
                  <input type="number" name="engine_kw" className="form-control" value={currentPref.engine_kw || ''} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label>Baterija (kWh)</label>
                  <input type="number" name="battery_kwh" className="form-control" value={currentPref.battery_kwh || ''} onChange={handleChange} />
                </div>
              </>
            )}

            {vehicleType === 'motorcycle' && (
              <>
                <div className="col-md-6">
                  <label>Moč (kW)</label>
                  <input type="number" name="engine_kw" className="form-control" value={currentPref.engine_kw || ''} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label>Moč (HP)</label>
                  <input type="number" name="engine_hp" className="form-control" value={currentPref.engine_hp || ''} onChange={handleChange} />
                </div>
              </>
            )}

            <div className="col-12 text-end">
              <button type="button" onClick={handleAddPreference} className="btn btn-success">
                ➕ Dodaj preference
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