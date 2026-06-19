import { z } from 'zod';

const requiredString = (message: string) =>
  z.string().trim().min(1, message).max(500, 'Must be 500 characters or less.');

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const appointmentFieldsSchema = z.object({
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
});

export const appointmentFormSchema = appointmentFieldsSchema.superRefine(
  (values, ctx) => {
    if (values.schedule < startOfToday()) {
      ctx.addIssue({
        code: 'custom',
        path: ['schedule'],
        message: 'Appointment date cannot be in the past.',
      });
    }
  },
);

export const scheduleAppointmentFormSchema = appointmentFieldsSchema
  .pick({
    primaryPhysician: true,
    reason: true,
    schedule: true,
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

export const cancelAppointmentFormSchema = z.object({
  cancellationReason: requiredString('Reason for cancellation is required.'),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
export type ScheduleAppointmentFormValues = z.infer<
  typeof scheduleAppointmentFormSchema
>;
export type CancelAppointmentFormValues = z.infer<
  typeof cancelAppointmentFormSchema
>;
