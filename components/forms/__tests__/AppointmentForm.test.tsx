import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AppointmentForm from '../AppointmentForm';
import {
  createAppointment,
  updateAppointment,
} from '@/lib/actions/appointment.actions';

vi.mock('next/image', () => ({
  default: ({
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ''} {...props} />
  ),
}));

vi.mock('@/lib/actions/appointment.actions', () => ({
  createAppointment: vi.fn(),
  updateAppointment: vi.fn(),
}));

const createAppointmentMock = vi.mocked(createAppointment);
const updateAppointmentMock = vi.mocked(updateAppointment);

const defaultProps = {
  userId: 'user-123',
  patientId: 'patient-456',
  primaryPhysician: 'Dr. Michael Lee',
};

describe('AppointmentForm', () => {
  beforeEach(() => {
    createAppointmentMock.mockReset();
    updateAppointmentMock.mockReset();
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

  it('renders update mode with existing appointment values', () => {
    render(
      <AppointmentForm
        {...defaultProps}
        mode="update"
        appointmentId="appointment-789"
        initialValues={{
          primaryPhysician: 'Dr. Adam Smith',
          reason: 'Follow-up',
          schedule: new Date('2026-12-20T12:00:00.000Z'),
          note: 'Bring lab results',
        }}
      />,
    );

    expect(screen.getByRole('combobox', { name: /doctor/i })).toHaveTextContent(
      'Dr. Adam Smith',
    );
    expect(screen.getByLabelText(/reason for appointment/i)).toHaveValue(
      'Follow-up',
    );
    expect(screen.getByLabelText(/additional comments\/notes/i)).toHaveValue(
      'Bring lab results',
    );
    expect(screen.getByLabelText(/expected appointment date/i)).toHaveValue(
      '12/20/2026',
    );
    expect(
      screen.getByRole('button', { name: /save changes/i }),
    ).toBeInTheDocument();
  });

  it('updates an appointment without overwriting status', async () => {
    const user = userEvent.setup();
    updateAppointmentMock.mockResolvedValue({ $id: 'appointment-789' });

    render(
      <AppointmentForm
        {...defaultProps}
        mode="update"
        appointmentId="appointment-789"
        initialValues={{
          primaryPhysician: defaultProps.primaryPhysician,
          reason: 'Original reason',
          schedule: new Date('2026-12-20T12:00:00.000Z'),
          note: 'Original note',
        }}
      />,
    );

    await user.clear(screen.getByLabelText(/reason for appointment/i));
    await user.type(
      screen.getByLabelText(/reason for appointment/i),
      'Updated reason',
    );
    await user.clear(screen.getByLabelText(/additional comments\/notes/i));
    await user.type(
      screen.getByLabelText(/additional comments\/notes/i),
      'Updated note',
    );

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateAppointmentMock).toHaveBeenCalledTimes(1);
    });

    expect(createAppointmentMock).not.toHaveBeenCalled();
    expect(updateAppointmentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'appointment-789',
        userId: defaultProps.userId,
        primaryPhysician: defaultProps.primaryPhysician,
        reason: 'Updated reason',
        note: 'Updated note',
      }),
    );
    expect(updateAppointmentMock.mock.calls[0][0]).not.toHaveProperty(
      'status',
    );
    expect(updateAppointmentMock.mock.calls[0][0].schedule).toBeInstanceOf(Date);
    expect(
      await screen.findByText(/appointment request updated/i),
    ).toBeInTheDocument();
  });
});
