import type { Status } from './common.types';

export type CreateAppointmentParams = {
  userId: string;
  patient: string;
  primaryPhysician: string;
  reason: string;
  schedule: Date;
  status: Status;
  note: string | undefined;
};

export type UpdateAppointmentParams = {
  appointmentId: string;
  userId: string;
  primaryPhysician: string;
  reason: string;
  schedule: Date;
  note: string | undefined;
};
