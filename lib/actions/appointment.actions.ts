'use server';

import { CreateAppointmentParams, UpdateAppointmentParams } from '@/types';
import { AppwriteException, ID, Query } from 'node-appwrite';

import { APPWRITE_DATABASE_ID, tablesDB } from '../appwrite.config';
import { parseStringify } from '../utils';
import { AppointmentRow } from '@/types/appointment.types';

const getAppointmentUserId = (appointment: AppointmentRow) =>
  appointment.userId ??
  (typeof appointment.patient === 'string'
    ? undefined
    : appointment.patient.userId);

/**
 * Creates a new appointment row in the database.
 *
 * @param appointment - The details of the appointment to create.
 * @returns - The created appointment row.
 * @throws - Throws an error if the appointment creation fails.
 */
export const createAppointment = async (
  appointment: CreateAppointmentParams,
) => {
  try {
    const newAppointment = await tablesDB.createRow({
      databaseId: APPWRITE_DATABASE_ID!,
      tableId: 'appointment',
      rowId: ID.unique(),
      data: {
        patient: appointment.patient,
        primaryPhysician: appointment.primaryPhysician,
        reason: appointment.reason,
        schedule: appointment.schedule,
        status: appointment.status,
        note: appointment.note,
      },
    });

    return parseStringify(newAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

/**
 * Updates an existing appointment row in the database.
 *
 * @param param0 - An object containing the details of the appointment to update.
 * @returns - The updated appointment row, or null if the appointment does not exist or the user ID does not match.
 * @throws - Throws an error if the appointment update fails.
 */
export const updateAppointment = async ({
  appointmentId,
  userId,
  patientId,
  primaryPhysician,
  reason,
  schedule,
  note,
}: UpdateAppointmentParams) => {
  try {
    const existingAppointment = await tablesDB.getRow<AppointmentRow>({
      databaseId: APPWRITE_DATABASE_ID!,
      tableId: 'appointment',
      rowId: appointmentId,
    });
    const appointmentPatientId =
      typeof existingAppointment.patient === 'string'
        ? existingAppointment.patient
        : existingAppointment.patient.$id;
    const appointmentUserId = getAppointmentUserId(existingAppointment);

    if (
      appointmentPatientId !== patientId ||
      (appointmentUserId && appointmentUserId !== userId)
    ) {
      return null;
    }

    const updatedAppointment = await tablesDB.updateRow({
      databaseId: APPWRITE_DATABASE_ID!,
      tableId: 'appointment',
      rowId: appointmentId,
      data: {
        primaryPhysician,
        reason,
        schedule,
        note,
      },
    });

    return parseStringify(updatedAppointment);
  } catch (error: unknown) {
    if (error instanceof AppwriteException && error.code === 404) {
      return null;
    }

    console.error('Error updating appointment:', error);
    throw error;
  }
};

/**
 * Fetches a list of recent appointments from the database, along with counts of appointments by status.
 *
 * @returns - An object containing the total count of appointments, counts of appointments by status, and the list of appointment documents.
 * @throws - Throws an error if fetching the recent appointments fails.
 *
 */
export const getRecentApppointmetList = async () => {
  try {
    const appointments = await tablesDB.listRows<AppointmentRow>({
      databaseId: APPWRITE_DATABASE_ID!,
      tableId: 'appointment',
      queries: [Query.orderDesc('$createdAt')],
    });

    const initialCounts = {
      scheduled: 0,
      pending: 0,
      cancelled: 0,
    };

    const counts = appointments.rows.reduce((acc, appointment) => {
      switch (appointment.status) {
        case 'scheduled':
          acc.scheduled += 1;
          break;
        case 'pending':
          acc.pending += 1;
          break;
        case 'cancelled':
          acc.cancelled += 1;
          break;
      }
      return acc;
    }, initialCounts);

    const data = {
      totalCount: appointments.total,
      ...counts,
      documents: appointments.rows,
    };

    return parseStringify(data);
  } catch (error) {
    console.error('Error fetching recent appointments:', error);
    throw error;
  }
};
