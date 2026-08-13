import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';

describe('Header', () => {
  it('renders main navigation links and city selector', () => {
    render(
      <MemoryRouter>
        <Header variant="main" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Разместить объявление')).toBeInTheDocument();
    expect(screen.getByText('Мои объявления')).toBeInTheDocument();
    expect(screen.getByText('Все категории')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Поиск по объявлениям')).toBeInTheDocument();
  });

  it('renders profile navigation variant', () => {
    render(
      <MemoryRouter>
        <Header variant="profile" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Бизнес360')).toBeInTheDocument();
    expect(screen.getByText('Недвижимость')).toBeInTheDocument();
  });

  it('opens and closes the mobile navigation with an accessible button', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header variant="main" />
      </MemoryRouter>,
    );

    const openButton = screen.getByRole('button', { name: 'Открыть меню' });
    expect(openButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(openButton);

    const closeButton = screen.getByRole('button', { name: 'Закрыть меню' });
    expect(closeButton).toHaveAttribute('aria-expanded', 'true');

    await user.click(closeButton);

    expect(screen.getByRole('button', { name: 'Открыть меню' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
