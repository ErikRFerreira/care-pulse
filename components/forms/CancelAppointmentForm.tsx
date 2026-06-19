'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import CustomFormField, { FormFieldType } from '@/components/CustomFormField';
import SubmitButton from '@/components/SubmitButton';
import { Form } from '@/components/ui/form';
import { updateAppointment } from '@/lib/actions/appointment.actions';
import {
  cancelAppointmentFormSchema,
  type CancelAppointmentFormValues,
} from '@/lib/validation/appointment.schemas';
import type { AppointmentListRow } from '@/types/appointment.types';

type Props = {
  appointment: AppointmentListRow;
  onSuccess?: () => void;
};

const getAppointmentPatientId = (appointment: AppointmentListRow) =>
  typeof appointment.patient === 'string'
    ? appointment.patient
    : appointment.patient.$id;

const getAppointmentUserId = (appointment: AppointmentListRow) =>
  appointment.userId ??
  (typeof appointment.patient === 'string'
    ? undefined
    : appointment.patient.userId);

function CancelAppointmentForm({ appointment, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null,
  );
  const patientId = getAppointmentPatientId(appointment);
  const userId = getAppointmentUserId(appointment);

  const form = useForm<CancelAppointmentFormValues>({
    resolver: zodResolver(cancelAppointmentFormSchema),
    defaultValues: {
      cancellationReason: appointment.cancellationReason ?? '',
    },
  });

  const onSubmit = async (values: CancelAppointmentFormValues) => {
    setIsLoading(true);
    setSubmissionMessage(null);

    try {
      if (!userId) {
        throw new Error('Patient user ID is required to cancel appointment.');
      }

      const updatedAppointment = await updateAppointment({
        appointmentId: appointment.$id,
        userId,
        patientId,
        primaryPhysician: appointment.primaryPhysician,
        reason: appointment.reason,
        schedule:
          appointment.schedule instanceof Date
            ? appointment.schedule
            : new Date(appointment.schedule),
        note: appointment.note,
        status: 'cancelled',
        cancellationReason: values.cancellationReason,
      });

      if (!updatedAppointment) {
        setSubmissionMessage('Unable to cancel appointment.');
        return;
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setSubmissionMessage('Unable to cancel appointment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-8"
      >
        <CustomFormField
          fieldType={FormFieldType.TEXTAREA}
          control={form.control}
          name="cancellationReason"
          label="Reason for cancellation"
          placeholder="ex: Urgent meeting came up"
        />

        {submissionMessage && (
          <p className="text-14-medium text-dark-700" role="status">
            {submissionMessage}
          </p>
        )}

        <SubmitButton
          isLoading={isLoading}
          className="shad-danger-btn w-full cursor-pointer"
        >
          Cancel appointment
        </SubmitButton>
      </form>
    </Form>
  );
}

export default CancelAppointmentForm;
