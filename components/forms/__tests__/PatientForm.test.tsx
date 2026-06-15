import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PatientForm from '../PatientForm';
import { createUser } from '@/lib/actions/patient.actions';

vi.mock('next/image', () => ({
  default: ({
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ''} {...props} />
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/actions/patient.actions', () => ({
  createUser: vi.fn(),
}));

const pushMock = vi.fn();
const createUserMock = vi.mocked(createUser);
const useRouterMock = vi.mocked(useRouter);

describe('PatientForm', () => {
  beforeEach(() => {
    pushMock.mockClear();
    createUserMock.mockReset();
    useRouterMock.mockReturnValue({
      push: pushMock,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it('renders the starter patient fields', () => {
    render(<PatientForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^phone number$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /get started/i }),
    ).toBeInTheDocument();
  });

  it('shows validation errors and does not create a user for invalid values', async () => {
    const user = userEvent.setup();
    render(<PatientForm />);

    await user.click(screen.getByRole('button', { name: /get started/i }));

    expect(
      await screen.findByText(/name must be at least 2 characters long/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/enter a valid email address/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it('creates a user and navigates to registration after valid submit', async () => {
    const user = userEvent.setup();
    createUserMock.mockResolvedValue({
      $id: 'user-123',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+15551234567',
    });

    render(<PatientForm />);

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.clear(screen.getByLabelText(/^phone number$/i));
    await user.type(screen.getByLabelText(/^phone number$/i), '+15551234567');
    await user.click(screen.getByRole('button', { name: /get started/i }));

    await waitFor(() => {
      expect(createUserMock).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+15551234567',
      });
    });

    expect(pushMock).toHaveBeenCalledWith('/patients/user-123/register');
  });
});
