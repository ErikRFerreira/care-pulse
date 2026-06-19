'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import CustomFormField, { FormFieldType } from '@/components/CustomFormField';
import SubmitButton from '@/components/SubmitButton';
import { Form } from '@/components/ui/form';
import { SelectGroup, SelectItem } from '@/components/ui/select';
import { updateAppointment } from '@/lib/actions/appointment.actions';
import { DOCTORS } from '@/lib/constants/doctors';
import {
  scheduleAppointmentFormSchema,
  type ScheduleAppointmentFormValues,
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

function ScheduleAppointmentForm({ appointment, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null,
  );
  const appointmentMinDate = new Date();
  const patientId = getAppointmentPatientId(appointment);
  const userId = getAppointmentUserId(appointment);

  const form = useForm<ScheduleAppointmentFormValues>({
    resolver: zodResolver(scheduleAppointmentFormSchema),
    defaultValues: {
      primaryPhysician: appointment.primaryPhysician,
      reason: appointment.reason,
      schedule:
        appointment.schedule instanceof Date
          ? appointment.schedule
          : new Date(appointment.schedule),
    },
  });

  const onSubmit = async (values: ScheduleAppointmentFormValues) => {
    setIsLoading(true);
    setSubmissionMessage(null);

    try {
      if (!userId) {
        throw new Error('Patient user ID is required to schedule appointment.');
      }

      const updatedAppointment = await updateAppointment({
        appointmentId: appointment.$id,
        userId,
        patientId,
        primaryPhysician: values.primaryPhysician,
        reason: values.reason,
        schedule: values.schedule,
        note: appointment.note,
        status: 'scheduled',
      });

      if (!updatedAppointment) {
        setSubmissionMessage('Unable to schedule appointment.');
        return;
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      setSubmissionMessage('Unable to schedule appointment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <CustomFormField
          fieldType={FormFieldType.SELECT}
          control={form.control}
          name="primaryPhysician"
          label="Doctor"
          placeholder="Select a doctor"
        >
          <SelectGroup>
            {DOCTORS.map((doctor) => (
              <SelectItem key={doctor.name} value={doctor.name}>
                <div className="flex items-center gap-2">
                  <Image
                    src={doctor.image}
                    alt={doctor.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span>{doctor.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </CustomFormField>

        <CustomFormField
          fieldType={FormFieldType.TEXTAREA}
          control={form.control}
          name="reason"
          label="Reason for appointment"
          placeholder="ex: Annual monthly check-up"
        />

        <CustomFormField
          fieldType={FormFieldType.DATE_PICKER}
          control={form.control}
          name="schedule"
          label="Expected appointment date"
          placeholder="Select your appointment date"
          minDate={appointmentMinDate}
        />

        {submissionMessage && (
          <p className="text-14-medium text-dark-700" role="status">
            {submissionMessage}
          </p>
        )}

        <SubmitButton isLoading={isLoading}>Schedule appointment</SubmitButton>
      </form>
    </Form>
  );
}

export default ScheduleAppointmentForm;
