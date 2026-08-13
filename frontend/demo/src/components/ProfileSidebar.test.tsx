import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(screen.getByRole('link', { name: 'Мои объявления' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Заказы' })).toBeInTheDocument();
  });

  it('opens and closes profile sections with an accessible button', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfileSidebar active="Мои объявления" />
      </MemoryRouter>,
    );

    const openButton = screen.getByRole('button', { name: 'Открыть разделы профиля' });
    expect(openButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(openButton);

    const closeButton = screen.getByRole('button', { name: 'Закрыть разделы профиля' });
    expect(closeButton).toHaveAttribute('aria-expanded', 'true');

    await user.click(closeButton);

    expect(screen.getByRole('button', { name: 'Открыть разделы профиля' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
