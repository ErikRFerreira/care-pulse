import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AppointmentForm from '../AppointmentForm';
import { createAppointment } from '@/lib/actions/patient.actions';

vi.mock('next/image', () => ({
  default: ({
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ''} {...props} />
  ),
}));

vi.mock('@/lib/actions/patient.actions', () => ({
  createAppointment: vi.fn(),
}));

const createAppointmentMock = vi.mocked(createAppointment);

const defaultProps = {
  userId: 'user-123',
  patientId: 'patient-456',
  primaryPhysician: 'Dr. Michael Lee',
};

describe('AppointmentForm', () => {
  beforeEach(() => {
    createAppointmentMock.mockReset();
  });

  it('renders appointment fields and submit control', () => {
    render(<AppointmentForm {...defaultProps} />);

    expect(screen.getByLabelText(/doctor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason for appointment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/additional comments\/notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expected appointment date/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit and continue/i }),
    ).toBeInTheDocument();
  });

  it('preselects the patient primary physician', () => {
    render(<AppointmentForm {...defaultProps} />);

    expect(screen.getByRole('combobox', { name: /doctor/i })).toHaveTextContent(
      defaultProps.primaryPhysician,
    );
  });

  it('shows validation errors and does not create an appointment for invalid values', async () => {
    const user = userEvent.setup();
    render(<AppointmentForm {...defaultProps} primaryPhysician="" />);

    await user.click(
      screen.getByRole('button', { name: /submit and continue/i }),
    );

    expect(await screen.findByText(/doctor is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/reason for appointment is required/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/expected appointment date is required/i),
    ).toBeInTheDocument();
    expect(createAppointmentMock).not.toHaveBeenCalled();
  });

  it('submits valid appointment data with pending status', async () => {
    const user = userEvent.setup();
    createAppointmentMock.mockResolvedValue({ $id: 'appointment-789' });

    render(<AppointmentForm {...defaultProps} />);

    await user.type(
      screen.getByLabelText(/reason for appointment/i),
      'Annual check-up',
    );
    await user.type(
      screen.getByLabelText(/additional comments\/notes/i),
      'Prefer afternoon',
    );
    await user.type(
      screen.getByLabelText(/expected appointment date/i),
      '12/20/2026',
    );

    await user.click(
      screen.getByRole('button', { name: /submit and continue/i }),
    );

    await waitFor(() => {
      expect(createAppointmentMock).toHaveBeenCalledTimes(1);
    });

    expect(createAppointmentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: defaultProps.userId,
        patient: defaultProps.patientId,
        primaryPhysician: defaultProps.primaryPhysician,
        reason: 'Annual check-up',
        note: 'Prefer afternoon',
        status: 'pending',
      }),
    );
    expect(createAppointmentMock.mock.calls[0][0].schedule).toBeInstanceOf(Date);
    expect(
      await screen.findByText(/appointment request submitted/i),
    ).toBeInTheDocument();
  });
});
