import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListingCard } from './ListingCard';

const listing = {
  id: '1',
  title: 'Смартфон Huawei Nova 11',
  price: '18 500 ₽',
  city: 'Москва',
  categoryId: 'electronics',
  publishedAgo: '2 часа назад',
  photo: '📱',
  hasDelivery: true,
  photoCount: 7,
  sellerRating: 4.8,
};

describe('ListingCard', () => {
  it('renders listing title and price', () => {
    render(<ListingCard listing={listing} />);

    expect(screen.getByText('Смартфон Huawei Nova 11')).toBeInTheDocument();
    expect(screen.getByText('18 500 ₽')).toBeInTheDocument();
  });

  it('renders delivery badge and rating when present', () => {
    render(<ListingCard listing={listing} />);

    expect(screen.getByText('🚚')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('renders placeholder button with correct aria-label', () => {
    render(<ListingCard listing={listing} />);

    expect(screen.getByRole('button', { name: /в избранное/i })).toBeInTheDocument();
  });
});
