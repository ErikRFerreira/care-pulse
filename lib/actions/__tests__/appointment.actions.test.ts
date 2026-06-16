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
  getRow: vi.fn(),
  updateRow: vi.fn(),
  unique: vi.fn(() => 'unique-id'),
}));

vi.mock('node-appwrite', () => ({
  AppwriteException: appwriteMocks.AppwriteException,
  ID: {
    unique: appwriteMocks.unique,
  },
}));

vi.mock('@/lib/appwrite.config', () => ({
  APPWRITE_DATABASE_ID: 'database-id',
  tablesDB: {
    createRow: appwriteMocks.createRow,
    getRow: appwriteMocks.getRow,
    updateRow: appwriteMocks.updateRow,
  },
}));

import { createAppointment, updateAppointment } from '../appointment.actions';

describe('appointment actions', () => {
  beforeEach(() => {
    [
      appwriteMocks.createRow,
      appwriteMocks.getRow,
      appwriteMocks.updateRow,
      appwriteMocks.unique,
    ].forEach((mock) => mock.mockClear());
    appwriteMocks.unique.mockReturnValue('unique-id');
  });

  it('creates an appointment row', async () => {
    const schedule = new Date('2026-12-20T12:00:00.000Z');
    appwriteMocks.createRow.mockResolvedValue({
      $id: 'appointment-789',
    });

    await expect(
      createAppointment({
        userId: 'user-123',
        patient: 'patient-456',
        primaryPhysician: 'Dr. Michael Lee',
        reason: 'Annual checkup',
        schedule,
        status: 'pending',
        note: 'Bring labs',
      }),
    ).resolves.toEqual({
      $id: 'appointment-789',
    });

    expect(appwriteMocks.createRow).toHaveBeenCalledWith({
      databaseId: 'database-id',
      tableId: 'appointment',
      rowId: 'unique-id',
      data: {
        patient: 'patient-456',
        primaryPhysician: 'Dr. Michael Lee',
        reason: 'Annual checkup',
        schedule,
        status: 'pending',
        note: 'Bring labs',
      },
    });
  });

  it('does not update an appointment owned by another user', async () => {
    appwriteMocks.getRow.mockResolvedValue({
      $id: 'appointment-789',
      patient: {
        $id: 'other-patient',
        userId: 'other-user',
      },
      primaryPhysician: 'Dr. Michael Lee',
      reason: 'Follow-up',
      schedule: '2026-12-20T12:00:00.000Z',
      status: 'pending',
      note: 'Original note',
    });

    const result = await updateAppointment({
      appointmentId: 'appointment-789',
      userId: 'user-123',
      patientId: 'patient-456',
      primaryPhysician: 'Dr. Adam Smith',
      reason: 'Updated reason',
      schedule: new Date('2026-12-21T12:00:00.000Z'),
      note: 'Updated note',
    });

    expect(result).toBeNull();
    expect(appwriteMocks.updateRow).not.toHaveBeenCalled();
  });

  it('updates editable appointment fields without status', async () => {
    const schedule = new Date('2026-12-21T12:00:00.000Z');
    appwriteMocks.getRow.mockResolvedValue({
      $id: 'appointment-789',
      patient: 'patient-456',
      primaryPhysician: 'Dr. Michael Lee',
      reason: 'Follow-up',
      schedule: '2026-12-20T12:00:00.000Z',
      status: 'scheduled',
      note: 'Original note',
    });
    appwriteMocks.updateRow.mockResolvedValue({ $id: 'appointment-789' });

    await updateAppointment({
      appointmentId: 'appointment-789',
      userId: 'user-123',
      patientId: 'patient-456',
      primaryPhysician: 'Dr. Adam Smith',
      reason: 'Updated reason',
      schedule,
      note: 'Updated note',
    });

    expect(appwriteMocks.updateRow).toHaveBeenCalledWith({
      databaseId: 'database-id',
      tableId: 'appointment',
      rowId: 'appointment-789',
      data: {
        primaryPhysician: 'Dr. Adam Smith',
        reason: 'Updated reason',
        schedule,
        note: 'Updated note',
      },
    });
    expect(appwriteMocks.updateRow.mock.calls[0][0].data).not.toHaveProperty(
      'status',
    );
  });

  it('returns null when updating a missing appointment', async () => {
    appwriteMocks.getRow.mockRejectedValue(
      new appwriteMocks.AppwriteException('Not found', 404),
    );

    const result = await updateAppointment({
      appointmentId: 'missing-appointment',
      userId: 'user-123',
      patientId: 'patient-456',
      primaryPhysician: 'Dr. Adam Smith',
      reason: 'Updated reason',
      schedule: new Date('2026-12-21T12:00:00.000Z'),
      note: 'Updated note',
    });

    expect(result).toBeNull();
    expect(appwriteMocks.updateRow).not.toHaveBeenCalled();
  });
});
