import { render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AppointmentSuccess from '../page';
import {
  getAppointmentById,
  getPatientByUserId,
  getUserById,
} from '@/lib/actions/patient.actions';
import { notFound } from 'next/navigation';

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
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/actions/patient.actions', () => ({
  getAppointmentById: vi.fn(),
  getPatientByUserId: vi.fn(),
  getUserById: vi.fn(),
}));

const getUserByIdMock = vi.mocked(getUserById);
const getPatientByUserIdMock = vi.mocked(getPatientByUserId);
const getAppointmentByIdMock = vi.mocked(getAppointmentById);
const notFoundMock = vi.mocked(notFound);

const defaultProps = {
  params: Promise.resolve({
    userId: 'user-123',
    appointmentId: 'appointment-789',
  }),
  searchParams: Promise.resolve({
    action: 'created',
  }),
};

const defaultUser = {
  $id: 'user-123',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+15555550123',
};

const defaultPatient = {
  $id: 'patient-456',
  userId: 'user-123',
  primaryPhysician: 'Dr. Michael Lee',
};

const defaultAppointment = {
  $id: 'appointment-789',
  userId: 'user-123',
  patientId: 'patient-456',
  primaryPhysician: 'Dr. Adam Smith',
  reason: 'Annual checkup',
  schedule: new Date('2026-12-20T12:00:00.000Z'),
  status: 'pending',
  note: '',
};

const renderPage = async (
  props: Parameters<typeof AppointmentSuccess>[0] = defaultProps,
) => {
  render(await AppointmentSuccess(props));
};

describe('AppointmentSuccess', () => {
  beforeEach(() => {
    getUserByIdMock.mockReset();
    getPatientByUserIdMock.mockReset();
    getAppointmentByIdMock.mockReset();
    notFoundMock.mockClear();

    getUserByIdMock.mockResolvedValue(defaultUser);
    getPatientByUserIdMock.mockResolvedValue(defaultPatient);
    getAppointmentByIdMock.mockResolvedValue(defaultAppointment);
  });

  it('renders created copy and appointment details for a valid appointment', async () => {
    await renderPage();

    expect(
      screen.getByRole('heading', {
        name: /your appointment request has been successfully submitted/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Dr. Adam Smith')).toBeInTheDocument();
    expect(screen.getByText(/Dec 20, 2026/i)).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it('renders updated copy for an updated appointment', async () => {
    await renderPage({
      params: defaultProps.params,
      searchParams: Promise.resolve({ action: 'updated' }),
    });

    expect(
      screen.getByRole('heading', {
        name: /your appointment request has been successfully updated/i,
      }),
    ).toBeInTheDocument();
  });

  it.each([
    undefined,
    'deleted',
    ['created', 'updated'],
  ])('calls notFound for invalid action %s', async (action) => {
    await expect(
      AppointmentSuccess({
        params: defaultProps.params,
        searchParams: Promise.resolve({ action }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalled();
  });

  it.each([
    ['missing user', { user: null }],
    ['missing patient', { patient: null }],
    ['missing appointment', { appointment: null }],
    [
      'appointment owned by another user',
      {
        appointment: {
          ...defaultAppointment,
          userId: 'other-user',
        },
      },
    ],
    [
      'appointment owned by another patient',
      {
        appointment: {
          ...defaultAppointment,
          patientId: 'other-patient',
        },
      },
    ],
  ])('calls notFound for %s', async (_scenario, overrides) => {
    getUserByIdMock.mockResolvedValue(
      'user' in overrides ? overrides.user : defaultUser,
    );
    getPatientByUserIdMock.mockResolvedValue(
      'patient' in overrides ? overrides.patient : defaultPatient,
    );
    getAppointmentByIdMock.mockResolvedValue(
      'appointment' in overrides
        ? overrides.appointment
        : defaultAppointment,
    );

    await expect(AppointmentSuccess(defaultProps)).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(notFoundMock).toHaveBeenCalled();
  });
});
