import { useState } from 'react';
import type { CarSearchParams } from '../types/car';

interface Props {
  onSearch: (params: any) => void;
}

const makes = ['Audi', 'BMW', 'Mercedes', 'Toyota', 'Volkswagen', 'Ford'];
const models = ['A4', 'A6', 'Golf', 'Passat', 'Yaris', 'C-Class', 'Focus'];
const years = Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => 1900 + i);
const mileageRanges = [
  [0, 5000], [5000, 10000], [10000, 20000],
  [20000, 50000], [50000, 100000], [100000, 150000], [150000, 200000],
];
const priceRanges = [500, 2000, 5000, 10000, 20000, 30000, 50000, 75000, 100000, 150000, 200000, 300000];
const powerRangesKw = [[20, 50], [51, 75], [76, 100], [101, 150], [151, 200], [201, 300]];
const powerRangesHp = powerRangesKw.map(([from, to]) => [Math.round(from * 1.36), Math.round(to * 1.36)]);

export default function SearchForm({ onSearch }: Props) {
  const [form, setForm] = useState<CarSearchParams>({
  make: '', model: '', yearFrom: '', mileageFrom: '', mileageTo: '',
  fuel_type: '', shifter_type: '', powerUnit: 'kW',
  powerFrom: '', powerTo: '', priceFrom: '', priceTo: ''
});

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(form);
  };

  const selectedPowerRanges = form.powerUnit === 'HP' ? powerRangesHp : powerRangesKw;

  return (
    <form onSubmit={handleSubmit} className="glass-form p-4 shadow">
      <div className="row g-3">

        <div className="col-md-6">
          <label className="form-label">Znamka</label>
          <select name="make" className="form-select" value={form.make} onChange={handleChange}>
            <option value="">Vse znamke</option>
            {makes.map(make => <option key={make} value={make}>{make}</option>)}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">Model</label>
          <select name="model" className="form-select" value={form.model} onChange={handleChange}>
            <option value="">Vsi modeli</option>
            {models.map(model => <option key={model} value={model}>{model}</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Letnik (od)</label>
          <select name="yearFrom" className="form-select" value={form.yearFrom} onChange={handleChange}>
            <option value="">Poljubno</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Kilometri (od)</label>
          <select name="mileageFrom" className="form-select" value={form.mileageFrom} onChange={handleChange}>
            <option value="">Min</option>
            {mileageRanges.map(([from]) => <option key={from} value={from}>{from.toLocaleString()} km</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Kilometri (do)</label>
          <select name="mileageTo" className="form-select" value={form.mileageTo} onChange={handleChange}>
            <option value="">Max</option>
            {mileageRanges.map(([_, to]) => <option key={to} value={to}>{to.toLocaleString()} km</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Gorivo</label>
          <select name="fuel_type" className="form-select" value={form.fuel_type} onChange={handleChange}>
            <option value="">Izberi...</option>
            <option value="Diesel">Diesel</option>
            <option value="Petrol">Petrol</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Electric">Electric</option>
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Menjalnik</label>
          <select name="shifter_type" className="form-select" value={form.shifter_type} onChange={handleChange}>
            <option value="">Izberi...</option>
            <option value="Manual">Ročni</option>
            <option value="Automatic">Avtomatski</option>
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label">Moč motorja</label>
          <div className="d-flex gap-2">
            <select name="powerFrom" className="form-select" value={form.powerFrom} onChange={handleChange}>
              <option value="">Min</option>
              {selectedPowerRanges.map(([from]) => <option key={from} value={from}>{from} {form.powerUnit}</option>)}
            </select>
            <select name="powerTo" className="form-select" value={form.powerTo} onChange={handleChange}>
              <option value="">Max</option>
              {selectedPowerRanges.map(([_, to]) => <option key={to} value={to}>{to} {form.powerUnit}</option>)}
            </select>
            <select name="powerUnit" className="form-select" value={form.powerUnit} onChange={handleChange}>
              <option value="kW">kW</option>
              <option value="HP">HP</option>
            </select>
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label">Cena od (€)</label>
          <select name="priceFrom" className="form-select" value={form.priceFrom} onChange={handleChange}>
            <option value="">Min</option>
            {priceRanges.map(p => <option key={p} value={p}>{p.toLocaleString()} €</option>)}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">Cena do (€)</label>
          <select name="priceTo" className="form-select" value={form.priceTo} onChange={handleChange}>
            <option value="">Max</option>
            {priceRanges.map(p => <option key={p} value={p}>{p.toLocaleString()} €</option>)}
          </select>
        </div>

      </div>

      <div className="text-center mt-4">
        <button className="btn btn-dark px-5 py-2">🔍 Išči</button>
      </div>
    </form>
  );
}
