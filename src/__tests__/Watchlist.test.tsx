import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Watchlist from '../pages/Watchlist';
import { getAuth } from 'firebase/auth';

jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));

const mockedGetAuth = getAuth as jest.MockedFunction<typeof getAuth>;

const corolla = { _id: '1', make: 'Toyota', model: 'Corolla', price_eur: 10000, link: 'https://x/1' };
const golf = { _id: '2', make: 'VW', model: 'Golf', price_eur: null, link: 'https://x/2' };

function loginAs(uid: string | null) {
  const user = uid ? { uid } : null;
  mockedGetAuth.mockReturnValue({
    currentUser: user,
    onAuthStateChanged: jest.fn((cb: (u: unknown) => void) => { cb(user); return jest.fn(); }),
  } as any);
}

const store = (uid: string, items: unknown) =>
  localStorage.setItem(`watchlist-${uid}`, typeof items === 'string' ? items : JSON.stringify(items));
const stored = (uid: string) => JSON.parse(localStorage.getItem(`watchlist-${uid}`) ?? 'null');

const renderPage = () => render(<MemoryRouter><Watchlist /></MemoryRouter>);
const cardOf = (title: RegExp) => screen.getByRole('heading', { name: title }).closest('.card') as HTMLElement;

beforeEach(() => {
  localStorage.clear();
  loginAs('123');
});

describe('Watchlist page', () => {
  it('should show the empty message when the user has no saved vehicles', () => {
    renderPage();
    expect(screen.getByText(/seznam spremljanja je prazen/i)).toBeInTheDocument();
  });

  it('should list every saved vehicle with its price', () => {
    store('123', [corolla, golf]);
    renderPage();
    // price format depends on the runtime locale (10,000 / 10.000 / 10 000)
    expect(within(cardOf(/toyota corolla/i)).getByText(/^10[.,\s ]?000 €$/)).toBeInTheDocument();
    expect(within(cardOf(/vw golf/i)).getByText('—')).toBeInTheDocument();
    expect(screen.queryByText(/seznam spremljanja je prazen/i)).not.toBeInTheDocument();
  });

  it('should link each card to the original listing in a new tab', () => {
    store('123', [corolla]);
    renderPage();
    const link = screen.getByRole('link', { name: /ogled ponudbe/i });
    expect(link).toHaveAttribute('href', 'https://x/1');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('should remove only the clicked vehicle from the page and from storage', () => {
    store('123', [corolla, golf]);
    renderPage();

    fireEvent.click(within(cardOf(/toyota corolla/i)).getByRole('button', { name: /odstrani/i }));

    expect(screen.queryByRole('heading', { name: /toyota corolla/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /vw golf/i })).toBeInTheDocument();
    expect(stored('123')).toEqual([golf]);
  });

  it('should show the empty message after the last vehicle is removed', () => {
    store('123', [corolla]);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /odstrani/i }));
    expect(screen.getByText(/seznam spremljanja je prazen/i)).toBeInTheDocument();
    expect(stored('123')).toEqual([]);
  });

  it('should only show the watchlist of the logged-in user', () => {
    store('other-user', [golf]);
    store('123', [corolla]);
    renderPage();
    expect(screen.getByRole('heading', { name: /toyota corolla/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /vw golf/i })).not.toBeInTheDocument();
  });

  it('should not touch another user\'s stored list when removing', () => {
    store('other-user', [corolla]);
    store('123', [corolla]);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /odstrani/i }));
    expect(stored('other-user')).toEqual([corolla]);
  });

  it('should show an empty list when nobody is logged in, even if lists exist', () => {
    loginAs(null);
    store('123', [corolla]);
    renderPage();
    expect(screen.getByText(/seznam spremljanja je prazen/i)).toBeInTheDocument();
  });

  it.each([
    ['invalid JSON', '{not json'],
    ['a non-array value', '{"_id":"1"}'],
  ])('should show an empty list instead of crashing when storage contains %s', (_label, raw) => {
    store('123', raw);
    renderPage();
    expect(screen.getByText(/seznam spremljanja je prazen/i)).toBeInTheDocument();
  });

  it('should unsubscribe from auth changes when unmounted', () => {
    const unsubscribe = jest.fn();
    mockedGetAuth.mockReturnValue({ currentUser: { uid: '123' }, onAuthStateChanged: () => unsubscribe } as any);
    renderPage().unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
