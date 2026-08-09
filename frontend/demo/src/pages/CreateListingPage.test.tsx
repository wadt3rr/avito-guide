import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateListingPage } from './CreateListingPage';

describe('CreateListingPage', () => {
  it('renders the create form and allows editing title', async () => {
    const user = userEvent.setup();
    render(<CreateListingPage />);

    expect(screen.getByText('Новое объявление')).toBeInTheDocument();
    const input = screen.getByLabelText('Название объявления');
    await user.type(input, 'Новая куртка');

    expect(input).toHaveValue('Новая куртка');
  });
});
