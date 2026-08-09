import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MyListingsPage } from './MyListingsPage';

describe('MyListingsPage', () => {
  it('renders page title and listing rows', () => {
    render(
      <MemoryRouter>
        <MyListingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Мои объявления' })).toBeInTheDocument();
    expect(screen.getByText('Продам телефон')).toBeInTheDocument();
    expect(screen.getByText('Поднять резюме')).toBeInTheDocument();
  });
});
