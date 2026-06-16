'use server';

import { CreateAppointmentParams, UpdateAppointmentParams } from '@/types';
import { AppwriteException, ID } from 'node-appwrite';

import { APPWRITE_DATABASE_ID, tablesDB } from '../appwrite.config';
import { parseStringify } from '../utils';
import { AppointmentRow } from '@/types/appointment.types';

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
        userId: appointment.userId,
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

    if (existingAppointment.userId !== userId) {
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
