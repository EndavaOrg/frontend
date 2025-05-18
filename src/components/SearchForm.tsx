import React, { useState } from 'react';
import type { CarSearchParams } from '../types/car';
import { FaCar, FaTachometerAlt, FaCalendarAlt, FaCogs } from 'react-icons/fa';

interface Props {
  onSearch: (params: CarSearchParams) => void;
}

export default function SearchForm({ onSearch }: Props) {
  const [form, setForm] = useState<CarSearchParams>({
    brand: '',
    model: '',
    yearFrom: 2015,
    yearTo: 2023,
    engineSize: 1.6,
    mileage: 100000,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card border-0 shadow-lg p-5 bg-white glass-form mb-5">
      <h2 className="text-center fw-bold mb-4 text-dark">🔎 Iskanje avtomobila</h2>
      <div className="row g-4">
        <div className="col-md-6">
          <label className="form-label fw-semibold">Znamka</label>
          <div className="input-group">
            <span className="input-group-text"><FaCar /></span>
            <input name="brand" value={form.brand} onChange={handleChange} className="form-control" placeholder="npr. Volkswagen" />
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Model</label>
          <div className="input-group">
            <span className="input-group-text"><FaCar /></span>
            <input name="model" value={form.model} onChange={handleChange} className="form-control" placeholder="npr. Golf" />
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Letnik od</label>
          <div className="input-group">
            <span className="input-group-text"><FaCalendarAlt /></span>
            <input type="number" name="yearFrom" value={form.yearFrom} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Letnik do</label>
          <div className="input-group">
            <span className="input-group-text"><FaCalendarAlt /></span>
            <input type="number" name="yearTo" value={form.yearTo} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Prostornina motorja (L)</label>
          <div className="input-group">
            <span className="input-group-text"><FaCogs /></span>
            <input type="number" step="0.1" name="engineSize" value={form.engineSize} onChange={handleChange} className="form-control" />
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Največ km</label>
          <div className="input-group">
            <span className="input-group-text"><FaTachometerAlt /></span>
            <input type="number" name="mileage" value={form.mileage} onChange={handleChange} className="form-control" />
          </div>
        </div>
      </div>
      <div className="text-center mt-5">
        <button className="btn btn-dark btn-lg px-5 py-2">Išči zdaj</button>
      </div>
    </form>
  );
}
