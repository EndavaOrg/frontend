import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Watchlist from '../pages/Watchlist';
import { getAuth } from 'firebase/auth';

jest.mock('firebase/auth');

beforeAll(() => {
  (globalThis as any).VITE_BACKEND_API_URL = 'http://localhost:5000';
});

describe('Watchlist Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockReturnValue({
      onAuthStateChanged: jest.fn((cb) => {
        cb({ uid: '123' });
        return jest.fn();
      }),
      currentUser: { uid: '123' },
    });
  });

  test('renders empty watchlist', () => {
    localStorage.clear();
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    expect(screen.getByText(/seznam spremljanja je prazen/i)).toBeInTheDocument();
  });

  test('renders watchlist items', () => {
    localStorage.setItem('watchlist-123', JSON.stringify([{ _id: '1', make: 'Toyota', model: 'Corolla', price_eur: 10000 }]));
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    expect(screen.getByText(/toyota corolla/i)).toBeInTheDocument();
    expect(screen.getByText(/10,000 €/)).toBeInTheDocument();
  });

  test('removes item from watchlist', () => {
    localStorage.setItem('watchlist-123', JSON.stringify([{ _id: '1', make: 'Toyota', model: 'Corolla', price_eur: 10000 }]));
    render(<MemoryRouter><Watchlist /></MemoryRouter>);
    fireEvent.click(screen.getByText(/odstrani/i));
    expect(JSON.parse(localStorage.getItem('watchlist-123')!)).toEqual([]);
  });
});