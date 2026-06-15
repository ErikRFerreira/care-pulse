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

const parseUser = (user: CreateUserParams & { $id: string }) => ({
  $id: user.$id,
  name: user.name,
  email: user.email,
  phone: user.phone,
});

/**
 * Creates a new user in the Appwrite database.
 * If a user with the same email already exists, it retrieves and returns that user instead.
 *
 * @param user - An object containing the name, email, and phone number of the user to be created.
 * @returns - A promise that resolves to the created or existing user object, or null if no user is found.
 * @throws - Throws an error if there is an issue with the database operation, other than a conflict (409) or not found (404) error.
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
 * Registers a patient by creating a new user in the Appwrite database and storing additional patient information.
 *
 * @param param0 - An object containing the registration details of the patient, including personal information, medical history, and insurance details.
 * @return - A promise that resolves to the registered patient object if the registration is successful, or null if the registration fails.
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
