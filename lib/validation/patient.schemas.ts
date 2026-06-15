import { z } from 'zod';

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

const phoneRegex = /^\+?[0-9\s().-]{7,20}$/;

const requiredString = (message: string) =>
  z.string().trim().min(1, message).max(100, 'Must be 100 characters or less.');

const optionalString = z
  .string()
  .trim()
  .max(100, 'Must be 100 characters or less.')
  .optional();

const consentSchema = (message: string) =>
  z.boolean().refine((value) => value, message);

export const patientFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .regex(phoneRegex, 'Enter a valid phone number.'),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export const registerFormSchema = z.object({
  userId: requiredString('User ID is required.'),
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long.')
    .max(100, 'Name must be 100 characters or less.'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .max(100, 'Email must be 100 characters or less.'),
  phone: requiredString('Phone number is required.').regex(
    phoneRegex,
    'Enter a valid phone number.',
  ),
  birthDate: z.date({
    error: 'Date of birth is required.',
  }),
  gender: z.enum(GENDER_OPTIONS, {
    error: 'Gender is required.',
  }),
  address: requiredString('Address is required.'),
  occupation: requiredString('Occupation is required.'),
  emergencyContactName: requiredString('Emergency contact name is required.'),
  emergencyContactNumber: requiredString(
    'Emergency phone number is required.',
  ).regex(phoneRegex, 'Enter a valid emergency phone number.'),
  primaryPhysician: requiredString('Primary care physician is required.'),
  insuranceProvider: requiredString('Insurance provider is required.'),
  insurancePolicyNumber: requiredString('Insurance policy number is required.'),
  allergies: optionalString,
  currentMedication: optionalString,
  familyMedicalHistory: optionalString,
  pastMedicalHistory: optionalString,
  identificationType: optionalString,
  identificationNumber: optionalString,
  identificationDocument: z.instanceof(FormData).optional(),
  treatmentConsent: consentSchema('Treatment consent is required.'),
  disclosureConsent: consentSchema('Disclosure consent is required.'),
  privacyConsent: consentSchema('Privacy consent is required.'),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
