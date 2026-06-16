'use server';

import type { CreateUserParams, RegisterUserParams } from '@/types';
import { AppwriteException, ID, Query } from 'node-appwrite';
import {
  APPWRITE_DATABASE_ID,
  NEXT_PUBLIC_APPWRITE_BUCKET_ID,
  storage,
  tablesDB,
  users,
} from '@/lib/appwrite.config';
import { parseStringify } from '../utils';
import { InputFile } from 'node-appwrite/file';
import { PatientRow } from '@/types/patient.types';
import { AppointmentRow } from '@/types/appointment.types';

/**
 * Parses a user object returned from the Appwrite database to extract relevant user information
 * for use in patient-related operations, such as creating or retrieving patient records.
 * This function ensures that the user data is formatted correctly for integration with patient data structures.
 *
 * @param user - An object containing the details of a user as returned from the Appwrite database,
 * including their unique ID, name, email, and phone number. The function will extract and format this data to be compatible with patient-related operations.
 * @returns - An object containing the user's unique ID, name, email, and phone number,
 * formatted for use in patient-related operations.
 * This parsed user data can then be integrated into patient creation or retrieval processes to ensure consistency
 * and compatibility with the expected data structures.
 */
const parseUser = (user: CreateUserParams & { $id: string }) => ({
  $id: user.$id,
  name: user.name,
  email: user.email,
  phone: user.phone,
});

/**
 * Parses a PatientRow object to extract relevant patient information for use in appointment-related operations,
 * such as creating or updating appointments.
 * This function ensures that the patient data is formatted correctly for integration with appointment data structures.
 *
 * @param patient - A PatientRow object containing detailed information about a patient,
 * including their unique ID, user ID, and primary physician information. The function will extract and format this data to be compatible with appointment-related operations.
 * @returns - An object containing the patient's unique ID, user ID, and primary physician information,
 * formatted for use in appointment-related operations. This parsed patient data can then be integrated into appointment creation or update processes to ensure consistency and compatibility with the expected data structures.
 */
const parsePatientForAppointment = (patient: PatientRow) => ({
  $id: patient.$id,
  userId: patient.userId,
  primaryPhysician: patient.primary_physician ?? patient.primaryPhysician ?? '',
});

/**
 * Retrieves the patient ID from an appointment's patient field,
 * which can be either a string (patient ID) or a PatientRow object.
 *
 * @param patient - The patient field from an appointment, which can be a string representing the patient ID
 * or a PatientRow object containing patient details.
 * @returns - The patient ID as a string, extracted from the patient field regardless of its original type.
 */
const getAppointmentPatientId = (patient: AppointmentRow['patient']) =>
  typeof patient === 'string' ? patient : patient.$id;

/**
 * Creates a new appointment in the Appwrite database with the provided appointment details.
 *
 * @param appointment - An object containing the details of the appointment to be created,
 * including user ID, patient information, primary physician, reason for the appointment, schedule, status,
 * and any additional notes.
 * @returns - A promise that resolves to the created appointment object if the operation is successful,
 * or throws an error if there is an issue with the database operation.
 */
const parseAppointmentForForm = (appointment: AppointmentRow) => ({
  $id: appointment.$id,
  userId: appointment.userId,
  patientId: getAppointmentPatientId(appointment.patient),
  primaryPhysician: appointment.primaryPhysician,
  reason: appointment.reason,
  schedule:
    appointment.schedule instanceof Date
      ? appointment.schedule
      : new Date(appointment.schedule),
  status: appointment.status,
  note: appointment.note ?? '',
});

/**
 * Creates a new user in the Appwrite database.
 * If a user with the same email already exists, it retrieves and returns that user instead.
 *
 * @param user - An object containing the name, email, and phone number of the user to be created.
 * @returns - A promise that resolves to the created or existing user object, or null if no user is found.
 * @throws - Throws an error if there is an issue with the database operation, other than a conflict (409)
 * or not found (404) error.
 */
export const createUser = async (user: CreateUserParams) => {
  try {
    const newUser = await users.create({
      userId: ID.unique(),
      email: user.email,
      phone: user.phone,
      name: user.name,
    });

    return parseUser(newUser);
  } catch (error: unknown) {
    if (error instanceof AppwriteException && error.code === 409) {
      const existingUser = await users.list({
        queries: [Query.equal('email', user.email)],
      });

      return existingUser.users[0] ? parseUser(existingUser.users[0]) : null;
    }

    throw error;
  }
};

/**
 * Retrieves a user from the Appwrite database by their unique ID.
 *
 * @param userId - The unique ID of the user to be retrieved.
 * @returns - A promise that resolves to the user object if found, or null if no user is found with the given ID.
 * @throws - Throws an error if there is an issue with the database operation, other than a not found (404) error.
 */
export const getUserById = async (userId: string) => {
  try {
    const user = await users.get({ userId: userId });
    return parseStringify(user);
  } catch (error: unknown) {
    console.log('Error fetching user by ID:', error);
    if (error instanceof AppwriteException && error.code === 404) {
      return null;
    }

    throw error;
  }
};

/**
 * Retrieves patient information associated with a specific user ID from the Appwrite database.
 *
 * @param userId - The unique ID of the user whose patient information is to be retrieved.
 * @returns - A promise that resolves to the patient object if found, or null if no patient is found for the given user ID.
 * @throws - Throws an error if there is an issue with the database operation.
 */
export const getPatientByUserId = async (userId: string) => {
  try {
    const patients = await tablesDB.listRows<PatientRow>({
      databaseId: APPWRITE_DATABASE_ID!,
      tableId: 'patient',
      queries: [Query.equal('userId', userId)],
    });

    const patient = patients.rows[0];

    return patient ? parseStringify(parsePatientForAppointment(patient)) : null;
  } catch (error) {
    console.error('Error fetching patient by user ID:', error);
    throw error;
  }
};

/**
 * Retrieves an appointment from the Appwrite database by its unique ID.
 *
 * @param appointmentId - The unique ID of the appointment to be retrieved.
 * @returns - A promise that resolves to the appointment object if found, or null if no appointment is found with the given ID.
 * @throws - Throws an error if there is an issue with the database operation, other than a not found (404) error.
 */
export const getAppointmentById = async (appointmentId: string) => {
  try {
    const appointment = await tablesDB.getRow<AppointmentRow>({
      databaseId: APPWRITE_DATABASE_ID!,
      tableId: 'appointment',
      rowId: appointmentId,
    });

    return parseStringify(parseAppointmentForForm(appointment));
  } catch (error: unknown) {
    if (error instanceof AppwriteException && error.code === 404) {
      return null;
    }

    console.error('Error fetching appointment by ID:', error);
    throw error;
  }
};

/**
 * Registers a patient by creating a new user in the Appwrite database and storing additional patient information.
 *
 * @param param0 - An object containing the registration details of the patient, including personal information,
 * medical history, and insurance details.
 * @return - A promise that resolves to the registered patient object if the registration is successful,
 * or null if the registration fails.
 * @throws - Throws an error if there is an issue with the database operation during registration.
 */
export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    // First we need to upload the file to Appwrite's storage
    let file;

    if (identificationDocument) {
      const inputFile = InputFile.fromBuffer(
        identificationDocument?.get('blob') as Blob,
        identificationDocument?.get('name') as string,
      );

      file = await storage.createFile(
        NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
        ID.unique(),
        inputFile,
      );
    }

    // Create new patient document
    const newPatient = await tablesDB.createRow({
      databaseId: APPWRITE_DATABASE_ID!,
      tableId: 'patient',
      rowId: ID.unique(),
      data: {
        userId: patient.userId,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        birthDate: patient.birthDate,
        gender: patient.gender.toLowerCase(),
        address: patient.address,
        occupation: patient.occupation,
        emergency_contact_name: patient.emergencyContactName,
        emergency_contanct_number: patient.emergencyContactNumber,
        primary_physician: patient.primaryPhysician,
        insurance_provider: patient.insuranceProvider,
        insurance_policy_number: patient.insurancePolicyNumber,
        allergies: patient.allergies,
        current_medication: patient.currentMedication,
        family_medical_history: patient.familyMedicalHistory,
        past_medical_history: patient.pastMedicalHistory,
        identification_type: patient.identificationType,
        identificaion_number: patient.identificationNumber,
        identification_document_id: file ? file.$id : null,
        identification_document_url: file
          ? `/storage/buckets/${NEXT_PUBLIC_APPWRITE_BUCKET_ID}/files/${file.$id}/view`
          : null,
        privacy_consent: patient.privacyConsent,
      },
    });

    return parseStringify(newPatient);
  } catch (error) {
    console.error('Error registering patient:', error);
    throw error;
  }
};
