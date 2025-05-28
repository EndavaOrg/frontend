import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTruck, FaCalendarAlt, FaWeightHanging, FaEuroSign } from 'react-icons/fa';
import { GiGearStick } from 'react-icons/gi';

interface Props {
  onSearch: (params: any) => void;
  isActive?: boolean;
}

export default function TruckSearchForm({ onSearch, isActive = true }: Props) {
  const [form, setForm] = useState({
    make: '', model: '', yearFrom: '', mileageFrom: '', mileageTo: '',
    fuel_type: '', shifter_type: '', loadCapacityFrom: '', loadCapacityTo: '',
    axleCount: '', priceFrom: '', priceTo: '',
  });

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

  const years = Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => 1900 + i).reverse();
  const mileageRanges = [[0, 50000], [50000, 100000], [100000, 200000], [200000, 400000], [400000, 600000], [600000, 800000], [800000, 1000000]];
  const loadCapacityRanges = [[0, 3000], [3001, 6000], [6001, 9000], [9001, 12000], [12001, 16000], [16001, 20000]];
  const axleCounts = [2, 3, 4, 5, 6, 7, 8];
  const priceRanges = [1000, 5000, 10000, 20000, 50000, 75000, 100000, 150000, 200000];

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/trucks/makes`)
      .then(res => {
        const makesRaw = res.data?.Makes;
        if (!makesRaw) {
          console.error("Makes data is undefined or malformed:", res.data);
          return;
        }
        const makes = (makesRaw as any[]).map(m => m.make_display);
        setMakes([...new Set(makes)].sort());
      })
      .catch(err => {
        console.error("Failed to fetch truck makes:", err);
      });
  }, []);

  useEffect(() => {
    if (!form.make) {
      setModels([]);
      return;
    }

    axios.get(`${API_BASE_URL}/api/trucks/models?make=${form.make.toLowerCase()}`)
      .then(res => {
        const modelsRaw = res.data?.Models;
        if (!modelsRaw) {
          console.error("Models data is undefined or malformed:", res.data);
          return;
        }
        const models = (modelsRaw as any[]).map(m => m.model_name);
        setModels([...new Set(models)].sort());
      })
      .catch(err => {
        console.error("Failed to fetch truck models:", err);
      });
  }, [form.make]);

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
          <select name="shifter_type" className="form-select" value={form.shifter_type} onChange={handleChange}>
            <option value="">Izberi...</option>
            <option value="Manual">Ročni</option>
            <option value="Automatic">Avtomatski</option>
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Nosilnost (kg)</label>
          <div className="d-flex gap-2">
            <select name="loadCapacityFrom" className="form-select" value={form.loadCapacityFrom} onChange={handleChange}>
              <option value="">Min</option>
              {loadCapacityRanges.map(([from]) => <option key={from} value={from}>{from.toLocaleString()} kg</option>)}
            </select>
            <select name="loadCapacityTo" className="form-select" value={form.loadCapacityTo} onChange={handleChange}>
              <option value="">Max</option>
              {loadCapacityRanges.map(([_, to]) => <option key={to} value={to}>{to.toLocaleString()} kg</option>)}
            </select>
          </div>
        </div>

        <div className="col-md-4">
          <label className="form-label">Število osi</label>
          <select name="axleCount" className="form-select" value={form.axleCount} onChange={handleChange}>
            <option value="">Izberi...</option>
            {axleCounts.map(count => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-center mt-4">
        <button className="btn btn-dark px-5 py-2">🔍 Išči</button>
      </div>
    </form>
  );
}
