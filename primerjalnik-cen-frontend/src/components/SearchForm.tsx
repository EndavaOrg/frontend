import React, { useState } from 'react';
import type { CarSearchParams } from '../types/car';

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
        <form onSubmit={handleSubmit} className="card card-body bg-light mb-4 shadow-sm">
            <h2 className="mb-3">Iskalni parametri</h2>
            <div className="row g-3">
                <div className="col-md-6">
                    <input name="brand" value={form.brand} onChange={handleChange} className="form-control" placeholder="Znamka" />
                </div>
                <div className="col-md-6">
                    <input name="model" value={form.model} onChange={handleChange} className="form-control" placeholder="Model" />
                </div>
                <div className="col-md-6">
                    <input type="number" name="yearFrom" value={form.yearFrom} onChange={handleChange} className="form-control" placeholder="Letnik od" />
                </div>
                <div className="col-md-6">
                    <input type="number" name="yearTo" value={form.yearTo} onChange={handleChange} className="form-control" placeholder="Letnik do" />
                </div>
                <div className="col-md-6">
                    <input type="number" step="0.1" name="engineSize" value={form.engineSize} onChange={handleChange} className="form-control" placeholder="Prostornina motorja (npr. 2.0)" />
                </div>
                <div className="col-md-6">
                    <input type="number" name="mileage" value={form.mileage} onChange={handleChange} className="form-control" placeholder="Največ prevoženih km" />
                </div>
            </div>
            <div className="mt-4 text-center">
                <button type="submit" className="btn btn-primary px-4">Išči</button>
            </div>
        </form>
    );
}