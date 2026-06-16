import { z } from 'zod';

const requiredString = (message: string) =>
  z.string().trim().min(1, message).max(500, 'Must be 500 characters or less.');

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const appointmentFormSchema = z
  .object({
    userId: requiredString('User ID is required.'),
    patient: requiredString('Patient is required.'),
    primaryPhysician: requiredString('Doctor is required.'),
    reason: requiredString('Reason for appointment is required.'),
    schedule: z.date({
      error: 'Expected appointment date is required.',
    }),
    note: z
      .string()
      .trim()
      .max(500, 'Notes must be 500 characters or less.')
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (values.schedule < startOfToday()) {
      ctx.addIssue({
        code: 'custom',
        path: ['schedule'],
        message: 'Appointment date cannot be in the past.',
      });
    }
  });

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
