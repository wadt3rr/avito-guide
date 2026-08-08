import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DeliveryPage } from './DeliveryPage';

describe('DeliveryPage', () => {
  it('renders delivery order and completed orders section', () => {
    render(
      <MemoryRouter>
        <DeliveryPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Заказы и заявки')).toBeInTheDocument();
    expect(screen.getByText('Ждёт отправки')).toBeInTheDocument();
    expect(screen.getByText('Показать')).toBeInTheDocument();
  });
});
