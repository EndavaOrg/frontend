import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaMotorcycle, FaCalendarAlt, FaTachometerAlt, FaEuroSign } from 'react-icons/fa';

interface Props {
  onSearch: (params: any, type: 'car' | 'motorcycle') => void;
}

export default function MotorcycleSearchForm({ onSearch }: Props) {
  const [form, setForm] = useState({
    make: '', model: '', yearFrom: '', mileageFrom: '', mileageTo: '',
    powerUnit: 'kW', powerFrom: '', powerTo: '', priceFrom: '', priceTo: '',
    first_registration: '', engineKwFrom: '', engineKwTo: ''
  });

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [resultCount, setResultCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

  const powerRanges = form.powerUnit === 'HP'
    ? [[10, 30], [31, 70], [71, 100], [101, 150]]
    : [[7, 22], [23, 50], [51, 75], [76, 110]];

  const years = Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => 1900 + i).reverse();
  const mileageRanges = [[0, 5000], [5000, 10000], [10000, 20000], [20000, 50000], [50000, 100000]];
  const priceRanges = [500, 1000, 2000, 4000, 7000, 10000, 15000, 20000];

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/motorcycles/makes`)
      .then(res => setMakes(res.data || []))
      .catch(err => console.error("Failed to fetch motorcycle makes:", err));
  }, []);

  useEffect(() => {
    if (!form.make) {
      setModels([]);
      return;
    }
    axios.get(`${API_BASE_URL}/api/motorcycles/models?make=${form.make}`)
      .then(res => setModels(res.data || []))
      .catch(err => console.error("Failed to fetch motorcycle models:", err));
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
        if (cleanedParams.powerFrom) cleanedParams.engineKwFrom = cleanedParams.powerUnit === 'HP'
          ? Math.round(Number(cleanedParams.powerFrom) / 1.36).toString()
          : cleanedParams.powerFrom;
        if (cleanedParams.powerTo) cleanedParams.engineKwTo = cleanedParams.powerUnit === 'HP'
          ? Math.round(Number(cleanedParams.powerTo) / 1.36).toString()
          : cleanedParams.powerTo;

        const query = new URLSearchParams(cleanedParams).toString();
        const response = await axios.get(`${API_BASE_URL}/api/motorcycles?${query}`);
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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = { ...form };
    if (params.yearFrom) params.first_registration = params.yearFrom;
    if (params.powerFrom) params.engineKwFrom = params.powerUnit === 'HP'
      ? Math.round(Number(params.powerFrom) / 1.36).toString()
      : params.powerFrom;
    if (params.powerTo) params.engineKwTo = params.powerUnit === 'HP'
      ? Math.round(Number(params.powerTo) / 1.36).toString()
      : params.powerTo;

    onSearch(params, 'motorcycle');
  };

  return (
    <form onSubmit={handleSubmit} className="glass-form p-4 shadow">
      <h4 className="text-center mb-4">Iskanje motorjev</h4>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label"><FaMotorcycle className="me-2" />Znamka</label>
          <select name="make" className="form-select" value={form.make} onChange={handleSelectChange}>
            <option value="">Izberi znamko</option>
            {makes.map(make => <option key={make} value={make}>{make}</option>)}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">Model</label>
          <select name="model" className="form-select" value={form.model} onChange={handleSelectChange}>
            <option value="">Izberi model</option>
            {models.map(model => <option key={model} value={model}>{model}</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label"><FaCalendarAlt className="me-2" />Letnik (od)</label>
          <select name="yearFrom" className="form-select" value={form.yearFrom} onChange={handleSelectChange}>
            <option value="">Poljubno</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label"><FaTachometerAlt className="me-2" />Kilometri (od)</label>
          <select name="mileageFrom" className="form-select" value={form.mileageFrom} onChange={handleSelectChange}>
            <option value="">Min</option>
            {mileageRanges.map(([from]) => <option key={from} value={from}>{from.toLocaleString()} km</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Kilometri (do)</label>
          <select name="mileageTo" className="form-select" value={form.mileageTo} onChange={handleSelectChange}>
            <option value="">Max</option>
            {mileageRanges.map(([_, to]) => <option key={to} value={to}>{to.toLocaleString()} km</option>)}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label"><FaMotorcycle className="me-2" />Moč motorja</label>
          <div className="d-flex gap-2">
            <select name="powerFrom" className="form-select" value={form.powerFrom} onChange={handleSelectChange}>
              <option value="">Min</option>
              {powerRanges.map(([from]) => <option key={from} value={from}>{from} {form.powerUnit}</option>)}
            </select>
            <select name="powerTo" className="form-select" value={form.powerTo} onChange={handleSelectChange}>
              <option value="">Max</option>
              {powerRanges.map(([_, to]) => <option key={to} value={to}>{to} {form.powerUnit}</option>)}
            </select>
            <select name="powerUnit" className="form-select" value={form.powerUnit} onChange={handleSelectChange}>
              <option value="kW">kW</option>
              <option value="HP">HP</option>
            </select>
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label"><FaEuroSign className="me-2" />Cena (€)</label>
          <div className="d-flex gap-2">
            <select name="priceFrom" className="form-select" value={form.priceFrom} onChange={handleSelectChange}>
              <option value="">Min</option>
              {priceRanges.map(p => <option key={p} value={p}>{p} €</option>)}
            </select>
            <select name="priceTo" className="form-select" value={form.priceTo} onChange={handleSelectChange}>
              <option value="">Max</option>
              {priceRanges.map(p => <option key={p} value={p}>{p} €</option>)}
            </select>
          </div>
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
