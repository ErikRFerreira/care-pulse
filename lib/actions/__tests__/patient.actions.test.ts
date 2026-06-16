import { beforeEach, describe, expect, it, vi } from 'vitest';

const appwriteMocks = vi.hoisted(() => ({
  AppwriteException: class MockAppwriteException extends Error {
    code: number;

    constructor(message: string, code: number) {
      super(message);
      this.code = code;
    }
  },
  createRow: vi.fn(),
  createFile: vi.fn(),
  equal: vi.fn((field: string, value: unknown) => ({ field, value })),
  fromBuffer: vi.fn(),
  getRow: vi.fn(),
  getUser: vi.fn(),
  listRows: vi.fn(),
  listUsers: vi.fn(),
  unique: vi.fn(() => 'unique-id'),
  createUser: vi.fn(),
}));

vi.mock('node-appwrite', () => ({
  AppwriteException: appwriteMocks.AppwriteException,
  ID: {
    unique: appwriteMocks.unique,
  },
  Query: {
    equal: appwriteMocks.equal,
  },
}));

vi.mock('@/lib/appwrite.config', () => ({
  APPWRITE_DATABASE_ID: 'database-id',
  NEXT_PUBLIC_APPWRITE_BUCKET_ID: 'bucket-id',
  storage: {
    createFile: appwriteMocks.createFile,
  },
  tablesDB: {
    createRow: appwriteMocks.createRow,
    getRow: appwriteMocks.getRow,
    listRows: appwriteMocks.listRows,
  },
  users: {
    create: appwriteMocks.createUser,
    get: appwriteMocks.getUser,
    list: appwriteMocks.listUsers,
  },
}));

vi.mock('node-appwrite/file', () => ({
  InputFile: {
    fromBuffer: appwriteMocks.fromBuffer,
  },
}));

import {
  createUser,
  getAppointmentById,
  getPatientByUserId,
  getUserById,
  registerPatient,
} from '../patient.actions';

describe('patient actions', () => {
  beforeEach(() => {
    [
      appwriteMocks.createRow,
      appwriteMocks.createFile,
      appwriteMocks.equal,
      appwriteMocks.fromBuffer,
      appwriteMocks.getRow,
      appwriteMocks.getUser,
      appwriteMocks.listRows,
      appwriteMocks.listUsers,
      appwriteMocks.unique,
      appwriteMocks.createUser,
    ].forEach((mock) => mock.mockClear());
    appwriteMocks.equal.mockImplementation((field: string, value: unknown) => ({
      field,
      value,
    }));
    appwriteMocks.unique.mockReturnValue('unique-id');
  });

  it('creates and returns a normalized user', async () => {
    appwriteMocks.createUser.mockResolvedValue({
      $id: 'user-123',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+15555550123',
      ignored: 'metadata',
    });

    await expect(
      createUser({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '+15555550123',
      }),
    ).resolves.toEqual({
      $id: 'user-123',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+15555550123',
    });

    expect(appwriteMocks.createUser).toHaveBeenCalledWith({
      userId: 'unique-id',
      email: 'ada@example.com',
      phone: '+15555550123',
      name: 'Ada Lovelace',
    });
  });

  it('returns an existing user when email creation conflicts', async () => {
    appwriteMocks.createUser.mockRejectedValue(
      new appwriteMocks.AppwriteException('Conflict', 409),
    );
    appwriteMocks.listUsers.mockResolvedValue({
      users: [
        {
          $id: 'user-existing',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          phone: '+15555550123',
        },
      ],
    });

    const result = await createUser({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+15555550123',
    });

    expect(result).toEqual({
      $id: 'user-existing',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+15555550123',
    });
    expect(appwriteMocks.listUsers).toHaveBeenCalledWith({
      queries: [{ field: 'email', value: 'ada@example.com' }],
    });
  });

  it('returns null when user lookup is not found', async () => {
    appwriteMocks.getUser.mockRejectedValue(
      new appwriteMocks.AppwriteException('Not found', 404),
    );

    await expect(getUserById('missing-user')).resolves.toBeNull();
  });

  it('returns the patient data needed to create an appointment', async () => {
    appwriteMocks.listRows.mockResolvedValue({
      rows: [
        {
          $id: 'patient-456',
          userId: 'user-123',
          primary_physician: 'Dr. Michael Lee',
        },
      ],
    });

    const result = await getPatientByUserId('user-123');

    expect(result).toEqual({
      $id: 'patient-456',
      userId: 'user-123',
      primaryPhysician: 'Dr. Michael Lee',
    });
    expect(appwriteMocks.listRows).toHaveBeenCalledWith({
      databaseId: 'database-id',
      tableId: 'patient',
      queries: [{ field: 'userId', value: 'user-123' }],
    });
  });

  it('returns appointment data shaped for the edit form', async () => {
    appwriteMocks.getRow.mockResolvedValue({
      $id: 'appointment-789',
      patient: {
        $id: 'patient-456',
        userId: 'user-123',
      },
      primaryPhysician: 'Dr. Michael Lee',
      reason: 'Follow-up',
      schedule: '2026-12-20T12:00:00.000Z',
      status: 'scheduled',
    });

    const result = await getAppointmentById('appointment-789');

    expect(result).toEqual({
      $id: 'appointment-789',
      userId: 'user-123',
      patientId: 'patient-456',
      primaryPhysician: 'Dr. Michael Lee',
      reason: 'Follow-up',
      schedule: '2026-12-20T12:00:00.000Z',
      status: 'scheduled',
      note: '',
    });
  });

  it('registers a patient and stores uploaded identification metadata', async () => {
    const identificationDocument = new FormData();
    const blob = new Blob(['passport']);
    identificationDocument.set('blob', blob);
    identificationDocument.set('name', 'passport.pdf');

    appwriteMocks.fromBuffer.mockReturnValue('input-file');
    appwriteMocks.createFile.mockResolvedValue({ $id: 'file-123' });
    appwriteMocks.createRow.mockResolvedValue({ $id: 'patient-456' });

    await registerPatient({
      userId: 'user-123',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+15555550123',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      gender: 'Female',
      address: '123 Main St',
      occupation: 'Engineer',
      emergencyContactName: 'Grace Hopper',
      emergencyContactNumber: '+15555550124',
      primaryPhysician: 'Dr. Michael Lee',
      insuranceProvider: 'Care Plan',
      insurancePolicyNumber: 'POL-123',
      allergies: 'None',
      currentMedication: 'None',
      familyMedicalHistory: 'None',
      pastMedicalHistory: 'None',
      identificationType: 'Passport',
      identificationNumber: 'A1234567',
      identificationDocument,
      privacyConsent: true,
    });

    expect(appwriteMocks.fromBuffer).toHaveBeenCalledWith(
      expect.any(Blob),
      'passport.pdf',
    );
    expect(appwriteMocks.createFile).toHaveBeenCalledWith(
      'bucket-id',
      'unique-id',
      'input-file',
    );
    expect(appwriteMocks.createRow).toHaveBeenCalledWith(
      expect.objectContaining({
        databaseId: 'database-id',
        tableId: 'patient',
        rowId: 'unique-id',
        data: expect.objectContaining({
          userId: 'user-123',
          gender: 'female',
          emergency_contact_name: 'Grace Hopper',
          emergency_contanct_number: '+15555550124',
          primary_physician: 'Dr. Michael Lee',
          identification_document_id: 'file-123',
          identification_document_url:
            '/storage/buckets/bucket-id/files/file-123/view',
          privacy_consent: true,
        }),
      }),
    );
  });
});
