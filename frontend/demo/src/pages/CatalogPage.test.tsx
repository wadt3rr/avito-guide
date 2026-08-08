import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CatalogPage } from './CatalogPage';

describe('CatalogPage', () => {
  it('renders categories, promo banner and listings', () => {
    render(<CatalogPage />);

    expect(screen.getByText('Всё для бизнеса')).toBeInTheDocument();
    expect(screen.getByText('Найдём клиентов,')).toBeInTheDocument();
    expect(screen.getByText('Смартфон Huawei Nova 11, 256 ГБ')).toBeInTheDocument();
    expect(screen.getByText('Кресло компьютерное игровое, ткань')).toBeInTheDocument();
  });
});
