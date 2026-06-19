import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CancelAppointmentForm from '../CancelAppointmentForm';
import { updateAppointment } from '@/lib/actions/appointment.actions';
import type { AppointmentListRow } from '@/types/appointment.types';

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
  status: 'scheduled',
  note: 'Prefer afternoon',
};

describe('CancelAppointmentForm', () => {
  beforeEach(() => {
    updateAppointmentMock.mockReset();
  });

  it('renders the cancellation reason field and submit control', () => {
    render(<CancelAppointmentForm appointment={appointment} />);

    expect(screen.getByLabelText(/reason for cancellation/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/urgent meeting came up/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cancel appointment/i }),
    ).toHaveClass('shad-danger-btn');
  });

  it('cancels the appointment with preserved fields and cancellation reason', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    updateAppointmentMock.mockResolvedValue({ $id: 'appointment-789' });

    render(
      <CancelAppointmentForm appointment={appointment} onSuccess={onSuccess} />,
    );

    await user.type(
      screen.getByLabelText(/reason for cancellation/i),
      'Urgent meeting came up',
    );
    await user.click(
      screen.getByRole('button', { name: /cancel appointment/i }),
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
        reason: 'Annual check-up',
        note: 'Prefer afternoon',
        status: 'cancelled',
        cancellationReason: 'Urgent meeting came up',
      }),
    );
    expect(updateAppointmentMock.mock.calls[0][0].schedule).toBeInstanceOf(
      Date,
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows validation error and does not update when reason is empty', async () => {
    const user = userEvent.setup();

    render(<CancelAppointmentForm appointment={appointment} />);

    await user.click(
      screen.getByRole('button', { name: /cancel appointment/i }),
    );

    expect(
      await screen.findByText(/reason for cancellation is required/i),
    ).toBeInTheDocument();
    expect(updateAppointmentMock).not.toHaveBeenCalled();
  });
});
