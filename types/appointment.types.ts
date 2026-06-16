import { Models } from 'node-appwrite';
import type { Status } from './common.types';
import { PatientRow } from './patient.types';

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

export type AppointmentRow = Models.Row & {
  userId: string;
  patient: string | PatientRow;
  primaryPhysician: string;
  reason: string;
  schedule: string | Date;
  status: Status;
  note?: string;
};
