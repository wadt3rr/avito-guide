import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileSidebar } from './ProfileSidebar';

describe('ProfileSidebar', () => {
  it('renders profile information and menu items', () => {
    render(
      <MemoryRouter>
        <ProfileSidebar active="Мои объявления" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Мария')).toBeInTheDocument();
    expect(screen.getByText('4,8')).toBeInTheDocument();
    expect(screen.getByText('Мои объявления')).toBeInTheDocument();
    expect(screen.getByText('Заказы')).toBeInTheDocument();
  });
});
