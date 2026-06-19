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
  listRows: vi.fn(),
  orderDesc: vi.fn((attribute: string) => `orderDesc:${attribute}`),
  revalidatePath: vi.fn(),
  select: vi.fn((attributes: string[]) => `select:${attributes.join(',')}`),
  updateRow: vi.fn(),
  unique: vi.fn(() => 'unique-id'),
}));

vi.mock('node-appwrite', () => ({
  AppwriteException: appwriteMocks.AppwriteException,
  ID: {
    unique: appwriteMocks.unique,
  },
  Query: {
    orderDesc: appwriteMocks.orderDesc,
    select: appwriteMocks.select,
  },
}));

vi.mock('@/lib/appwrite.config', () => ({
  APPWRITE_DATABASE_ID: 'database-id',
  tablesDB: {
    createRow: appwriteMocks.createRow,
    getRow: appwriteMocks.getRow,
    listRows: appwriteMocks.listRows,
    updateRow: appwriteMocks.updateRow,
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: appwriteMocks.revalidatePath,
}));

import {
  createAppointment,
  getRecentApppointmetList,
  updateAppointment,
} from '../appointment.actions';

describe('appointment actions', () => {
  beforeEach(() => {
    [
      appwriteMocks.createRow,
      appwriteMocks.getRow,
      appwriteMocks.listRows,
      appwriteMocks.orderDesc,
      appwriteMocks.revalidatePath,
      appwriteMocks.select,
      appwriteMocks.updateRow,
      appwriteMocks.unique,
    ].forEach((mock) => mock.mockClear());
    appwriteMocks.unique.mockReturnValue('unique-id');
    appwriteMocks.orderDesc.mockImplementation(
      (attribute: string) => `orderDesc:${attribute}`,
    );
    appwriteMocks.select.mockImplementation(
      (attributes: string[]) => `select:${attributes.join(',')}`,
    );
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
    expect(appwriteMocks.revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('updates appointment status when a status is provided', async () => {
    const schedule = new Date('2026-12-21T12:00:00.000Z');
    appwriteMocks.getRow.mockResolvedValue({
      $id: 'appointment-789',
      patient: {
        $id: 'patient-456',
        userId: 'user-123',
      },
      primaryPhysician: 'Dr. Michael Lee',
      reason: 'Follow-up',
      schedule: '2026-12-20T12:00:00.000Z',
      status: 'pending',
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
      status: 'scheduled',
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
        status: 'scheduled',
      },
    });
    expect(appwriteMocks.revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('updates cancellation status and reason when provided', async () => {
    const schedule = new Date('2026-12-21T12:00:00.000Z');
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
      note: 'Original note',
    });
    appwriteMocks.updateRow.mockResolvedValue({ $id: 'appointment-789' });

    await updateAppointment({
      appointmentId: 'appointment-789',
      userId: 'user-123',
      patientId: 'patient-456',
      primaryPhysician: 'Dr. Michael Lee',
      reason: 'Follow-up',
      schedule,
      note: 'Original note',
      status: 'cancelled',
      cancellationReason: 'Urgent meeting came up',
    });

    expect(appwriteMocks.updateRow).toHaveBeenCalledWith({
      databaseId: 'database-id',
      tableId: 'appointment',
      rowId: 'appointment-789',
      data: {
        primaryPhysician: 'Dr. Michael Lee',
        reason: 'Follow-up',
        schedule,
        note: 'Original note',
        status: 'cancelled',
        cancellationReason: 'Urgent meeting came up',
      },
    });
    expect(appwriteMocks.revalidatePath).toHaveBeenCalledWith('/admin');
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

  it('fetches recent appointments with selected patient relationship fields', async () => {
    appwriteMocks.listRows.mockResolvedValue({
      total: 2,
      rows: [
        {
          $id: 'appointment-789',
          patient: {
            $id: 'patient-456',
            name: 'Ada Lovelace',
            userId: 'user-123',
          },
          primaryPhysician: 'Dr. Michael Lee',
          reason: 'Annual checkup',
          schedule: '2026-12-20T12:00:00.000Z',
          status: 'scheduled',
          note: 'Bring labs',
        },
        {
          $id: 'appointment-790',
          patient: 'patient-999',
          primaryPhysician: 'Dr. Adam Smith',
          reason: 'Follow-up',
          schedule: '2026-12-21T12:00:00.000Z',
          status: 'pending',
        },
      ],
    });

    await expect(getRecentApppointmetList()).resolves.toEqual({
      totalCount: 2,
      scheduled: 1,
      pending: 1,
      cancelled: 0,
      documents: [
        {
          $id: 'appointment-789',
          patient: {
            $id: 'patient-456',
            name: 'Ada Lovelace',
            userId: 'user-123',
          },
          primaryPhysician: 'Dr. Michael Lee',
          reason: 'Annual checkup',
          schedule: '2026-12-20T12:00:00.000Z',
          status: 'scheduled',
          note: 'Bring labs',
        },
        {
          $id: 'appointment-790',
          patient: 'patient-999',
          primaryPhysician: 'Dr. Adam Smith',
          reason: 'Follow-up',
          schedule: '2026-12-21T12:00:00.000Z',
          status: 'pending',
        },
      ],
    });

    expect(appwriteMocks.orderDesc).toHaveBeenCalledWith('$createdAt');
    expect(appwriteMocks.select).toHaveBeenCalledWith([
      '*',
      'patient.$id',
      'patient.name',
      'patient.userId',
    ]);
    expect(appwriteMocks.listRows).toHaveBeenCalledWith({
      databaseId: 'database-id',
      tableId: 'appointment',
      queries: [
        'orderDesc:$createdAt',
        'select:*,patient.$id,patient.name,patient.userId',
      ],
    });
  });
});
