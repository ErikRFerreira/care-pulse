import { Models } from 'node-appwrite';
import type { Gender } from './common.types';

export interface CreateUserParams {
  name: string;
  email: string;
  phone: string;
}

export interface User extends CreateUserParams {
  $id: string;
}

export interface RegisterUserParams extends CreateUserParams {
  userId: string;
  birthDate: Date;
  gender: Gender;
  address: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  primaryPhysician: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  allergies?: string;
  currentMedication?: string;
  familyMedicalHistory?: string;
  pastMedicalHistory?: string;
  identificationType?: string;
  identificationNumber?: string;
  identificationDocument?: FormData;
  privacyConsent: boolean;
}

export type PatientRow = Models.Row & {
  userId: string;
  primary_physician?: string;
  primaryPhysician?: string;
};
