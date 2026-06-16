import { beforeEach, describe, expect, it, vi } from 'vitest';

const appwriteMocks = vi.hoisted(() => ({
  getRow: vi.fn(),
  updateRow: vi.fn(),
}));

vi.mock('@/lib/appwrite.config', () => ({
  APPWRITE_DATABASE_ID: 'database-id',
  NEXT_PUBLIC_APPWRITE_BUCKET_ID: 'bucket-id',
  storage: {},
  tablesDB: {
    getRow: appwriteMocks.getRow,
    updateRow: appwriteMocks.updateRow,
  },
  users: {},
}));

vi.mock('node-appwrite/file', () => ({
  InputFile: {
    fromBuffer: vi.fn(),
  },
}));

import { updateAppointment } from '../patient.actions';

describe('patient appointment actions', () => {
  beforeEach(() => {
    appwriteMocks.getRow.mockReset();
    appwriteMocks.updateRow.mockReset();
  });

  it('does not update an appointment owned by another user', async () => {
    appwriteMocks.getRow.mockResolvedValue({
      $id: 'appointment-789',
      userId: 'other-user',
      patient: 'patient-456',
      primaryPhysician: 'Dr. Michael Lee',
      reason: 'Follow-up',
      schedule: '2026-12-20T12:00:00.000Z',
      status: 'pending',
      note: 'Original note',
    });

    const result = await updateAppointment({
      appointmentId: 'appointment-789',
      userId: 'user-123',
      primaryPhysician: 'Dr. Adam Smith',
      reason: 'Updated reason',
      schedule: new Date('2026-12-21T12:00:00.000Z'),
      note: 'Updated note',
    });

    expect(result).toBeNull();
    expect(appwriteMocks.updateRow).not.toHaveBeenCalled();
  });

  it('updates editable appointment fields without status', async () => {
    appwriteMocks.getRow.mockResolvedValue({
      $id: 'appointment-789',
      userId: 'user-123',
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
      primaryPhysician: 'Dr. Adam Smith',
      reason: 'Updated reason',
      schedule: new Date('2026-12-21T12:00:00.000Z'),
      note: 'Updated note',
    });

    expect(appwriteMocks.updateRow).toHaveBeenCalledWith(
      expect.objectContaining({
        databaseId: 'database-id',
        tableId: 'appointment',
        rowId: 'appointment-789',
        data: expect.objectContaining({
          primaryPhysician: 'Dr. Adam Smith',
          reason: 'Updated reason',
          note: 'Updated note',
        }),
      }),
    );
    expect(appwriteMocks.updateRow.mock.calls[0][0].data).not.toHaveProperty(
      'status',
    );
  });
});
