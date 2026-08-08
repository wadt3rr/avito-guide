import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
