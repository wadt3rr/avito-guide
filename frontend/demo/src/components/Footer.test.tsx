import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('renders footer links and legal text', () => {
    render(<Footer />);

    expect(screen.getByText('Помощь')).toBeInTheDocument();
    expect(screen.getByText('Безопасность')).toBeInTheDocument();
    expect(screen.getByText(/Демонстрационная копия интерфейса/i)).toBeInTheDocument();
  });
});
