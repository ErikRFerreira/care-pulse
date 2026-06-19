import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ScheduleAppointmentForm from '../ScheduleAppointmentForm';
import { updateAppointment } from '@/lib/actions/appointment.actions';
import type { AppointmentListRow } from '@/types/appointment.types';

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
  updateAppointment: vi.fn(),
}));

const updateAppointmentMock = vi.mocked(updateAppointment);

const appointment: AppointmentListRow = {
  $id: 'appointment-789',
  $createdAt: '2026-06-01T12:00:00.000Z',
  $updatedAt: '2026-06-01T12:00:00.000Z',
  $permissions: [],
  $databaseId: 'database-id',
  $tableId: 'appointment',
  patient: {
    $id: 'patient-456',
    name: 'Ada Lovelace',
    userId: 'user-123',
  },
  primaryPhysician: 'Dr. Michael Lee',
  reason: 'Annual check-up',
  schedule: '2026-12-20T12:00:00.000Z',
  status: 'pending',
  note: 'Prefer afternoon',
};

describe('ScheduleAppointmentForm', () => {
  beforeEach(() => {
    updateAppointmentMock.mockReset();
  });

  it('renders prefilled appointment values', () => {
    render(<ScheduleAppointmentForm appointment={appointment} />);

    expect(screen.getByRole('combobox', { name: /doctor/i })).toHaveTextContent(
      'Dr. Michael Lee',
    );
    expect(screen.getByLabelText(/reason for appointment/i)).toHaveValue(
      'Annual check-up',
    );
    expect(screen.getByLabelText(/expected appointment date/i)).toHaveValue(
      '12/20/2026',
    );
  });

  it('schedules the appointment with preserved note and scheduled status', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    updateAppointmentMock.mockResolvedValue({ $id: 'appointment-789' });

    render(
      <ScheduleAppointmentForm
        appointment={appointment}
        onSuccess={onSuccess}
      />,
    );

    await user.clear(screen.getByLabelText(/reason for appointment/i));
    await user.type(
      screen.getByLabelText(/reason for appointment/i),
      'Updated reason',
    );
    await user.click(
      screen.getByRole('button', { name: /schedule appointment/i }),
    );

    await waitFor(() => {
      expect(updateAppointmentMock).toHaveBeenCalledTimes(1);
    });

    expect(updateAppointmentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'appointment-789',
        userId: 'user-123',
        patientId: 'patient-456',
        primaryPhysician: 'Dr. Michael Lee',
        reason: 'Updated reason',
        note: 'Prefer afternoon',
        status: 'scheduled',
      }),
    );
    expect(updateAppointmentMock.mock.calls[0][0].schedule).toBeInstanceOf(
      Date,
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows validation errors and does not update invalid values', async () => {
    const user = userEvent.setup();

    render(
      <ScheduleAppointmentForm
        appointment={{
          ...appointment,
          primaryPhysician: '',
          reason: '',
        }}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /schedule appointment/i }),
    );

    expect(await screen.findByText(/doctor is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/reason for appointment is required/i),
    ).toBeInTheDocument();
    expect(updateAppointmentMock).not.toHaveBeenCalled();
  });
});
