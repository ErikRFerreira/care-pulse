'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import CustomFormField, { FormFieldType } from '@/components/CustomFormField';
import SubmitButton from '@/components/SubmitButton';
import { Form } from '@/components/ui/form';
import { SelectGroup, SelectItem } from '@/components/ui/select';
import { createAppointment } from '@/lib/actions/patient.actions';
import { DOCTORS } from '@/lib/constants/doctors';
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from '@/lib/validation/appointment.schemas';

type Props = {
  userId: string;
  patientId: string;
  primaryPhysician: string;
};

const today = new Date();

function AppointmentForm({ userId, patientId, primaryPhysician }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null,
  );

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      userId,
      patient: patientId,
      primaryPhysician,
      reason: '',
      schedule: undefined,
      note: '',
    },
  });

  const onSubmit = async (values: AppointmentFormValues) => {
    setIsLoading(true);
    setSubmissionMessage(null);

    try {
      await createAppointment({
        ...values,
        note: values.note,
        status: 'pending',
      });
      form.reset({
        ...values,
        reason: '',
        schedule: undefined,
        note: '',
      });
      setSubmissionMessage('Appointment request submitted.');
    } catch (error) {
      console.error('Error creating appointment:', error);
      setSubmissionMessage('Unable to submit appointment request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-6"
      >
        <section className="flex flex-col gap-2">
          <h2 className="header text-light-200">Hey there {'\u{1F44B}'}</h2>
          <p className="text-16-regular text-dark-700">
            Request a new appointment in 10 seconds
          </p>
        </section>

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

        <div className="flex flex-col gap-6 xl:flex-row">
          <CustomFormField
            fieldType={FormFieldType.TEXTAREA}
            control={form.control}
            name="reason"
            label="Reason for appointment"
            placeholder="ex: Annual monthly check-up"
          />

          <CustomFormField
            fieldType={FormFieldType.TEXTAREA}
            control={form.control}
            name="note"
            label="Additional comments/notes"
            placeholder="ex: Prefer afternoon appointments, if possible"
          />
        </div>

        <CustomFormField
          fieldType={FormFieldType.DATE_PICKER}
          control={form.control}
          name="schedule"
          label="Expected appointment date"
          placeholder="Select your appointment date"
          minDate={today}
        />

        {submissionMessage && (
          <p className="text-14-medium text-dark-700" role="status">
            {submissionMessage}
          </p>
        )}

        <SubmitButton isLoading={isLoading}>Submit and continue</SubmitButton>
      </form>
    </Form>
  );
}

export default AppointmentForm;
