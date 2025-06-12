import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTruck, FaCalendarAlt, FaWeightHanging, FaEuroSign } from 'react-icons/fa';
import { GiGearStick } from 'react-icons/gi';
import { FaBolt } from 'react-icons/fa';

interface Props {
  onSearch: (params: any) => void;
  isActive?: boolean;
}

export default function TruckSearchForm({ onSearch, isActive = true }: Props) {
  const [form, setForm] = useState({
    make: '', model: '', yearFrom: '', mileageFrom: '', mileageTo: '',
    fuel_type: '', gearbox: '', priceFrom: '', priceTo: '',
    engineKwFrom: '', engineKwTo: ''
  });

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [resultCount, setResultCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

  const years = Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => 1900 + i).reverse();
  const mileageRanges = [[0, 50000], [50000, 100000], [100000, 200000], [200000, 400000], [400000, 600000], [600000, 800000], [800000, 1000000]];
  const priceRanges = [1000, 5000, 10000, 20000, 50000, 75000, 100000, 150000, 200000];
  const engineKwRanges = [50, 100, 150, 200, 300, 400, 500, 600, 700];

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/trucks/makes`)
      .then(res => setMakes(res.data.sort()))
      .catch(err => console.error("Failed to fetch truck makes:", err));
  }, []);

  useEffect(() => {
    if (!form.make) {
      setModels([]);
      return;
    }

    axios.get(`${API_BASE_URL}/api/trucks/models?make=${form.make}`)
      .then(res => setModels(res.data.sort()))
      .catch(err => console.error("Failed to fetch truck models:", err));
  }, [form.make]);

  useEffect(() => {
    const fetchCount = async () => {
      setCountLoading(true);
      try {
        const cleanedParams: Record<string, string> = {};
        for (const key in form) {
          const value = (form as any)[key];
          if (value !== '' && value !== null && value !== undefined) {
            cleanedParams[key] = value;
          }
        }

        if (cleanedParams.yearFrom) cleanedParams.first_registration = cleanedParams.yearFrom;

        const query = new URLSearchParams(cleanedParams).toString();
        const response = await axios.get(`${API_BASE_URL}/api/trucks?${query}`);
        setResultCount(response.data.length);
      } catch (err) {
        console.error('Failed to fetch count:', err);
        setResultCount(null);
      } finally {
        setCountLoading(false);
      }
    };

    fetchCount();
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(form);
  };

  return (
    <form onSubmit={handleSubmit} className={`glass-form p-4 shadow ${isActive ? '' : 'd-none'}`}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label"><FaTruck className="me-2" />Znamka</label>
          <select name="make" className="form-select" value={form.make} onChange={handleChange}>
            <option value="">Vse znamke</option>
            {makes.map(make => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label"><FaTruck className="me-2" />Model</label>
          <select name="model" className="form-select" value={form.model} onChange={handleChange}>
            <option value="">Vsi modeli</option>
            {models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label"><FaCalendarAlt className="me-2" />Letnik (od)</label>
          <select name="yearFrom" className="form-select" value={form.yearFrom} onChange={handleChange}>
            <option value="">Poljubno</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label"><FaWeightHanging className="me-2" />Kilometri (od)</label>
          <select name="mileageFrom" className="form-select" value={form.mileageFrom} onChange={handleChange}>
            <option value="">Min</option>
            {mileageRanges.map(([from]) => <option key={from} value={from}>{from.toLocaleString()} km</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label"><FaWeightHanging className="me-2" />Kilometri (do)</label>
          <select name="mileageTo" className="form-select" value={form.mileageTo} onChange={handleChange}>
            <option value="">Max</option>
            {mileageRanges.map(([_, to]) => <option key={to} value={to}>{to.toLocaleString()} km</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label"><FaEuroSign className="me-2" />Cena od (€)</label>
          <select name="priceFrom" className="form-select" value={form.priceFrom} onChange={handleChange}>
            <option value="">Min</option>
            {priceRanges.map(p => <option key={p} value={p}>{p.toLocaleString()} €</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label"><FaEuroSign className="me-2" />Cena do (€)</label>
          <select name="priceTo" className="form-select" value={form.priceTo} onChange={handleChange}>
            <option value="">Max</option>
            {priceRanges.map(p => <option key={p} value={p}>{p.toLocaleString()} €</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label"><GiGearStick className="me-2" />Menjalnik</label>
          <select name="gearbox" className="form-select" value={form.gearbox} onChange={handleChange}>
            <option value="">Izberi...</option>
            <option value="avtomatski">Avtomatski</option>
            <option value="ročni">Ročni</option>
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Gorivo</label>
          <select name="fuel_type" className="form-select" value={form.fuel_type} onChange={handleChange}>
            <option value="">Vse vrste</option>
            <option value="Diesel">Diesel</option>
            <option value="Bencin">Bencin</option>
            <option value="Električno">Električno</option>
            <option value="Hibrid">Hibrid</option>
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label"><FaBolt className="me-2" />Moč (kW) od</label>
          <select name="engineKwFrom" className="form-select" value={form.engineKwFrom} onChange={handleChange}>
            <option value="">Min</option>
            {engineKwRanges.map(p => <option key={p} value={p}>{p} kW</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label"><FaBolt className="me-2" />Moč (kW) do</label>
          <select name="engineKwTo" className="form-select" value={form.engineKwTo} onChange={handleChange}>
            <option value="">Max</option>
            {engineKwRanges.map(p => <option key={p} value={p}>{p} kW</option>)}
          </select>
        </div>
      </div>

      <div className="text-center mt-4">
        <button type="submit" className="btn btn-dark px-5 py-2">
          {countLoading ? 'Nalagam...' : resultCount !== null ? `${resultCount} rezultatov` : '🔍 Išči'}
        </button>
      </div>
    </form>
  );
}
