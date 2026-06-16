'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import CustomFormField, { FormFieldType } from '@/components/CustomFormField';
import SubmitButton from '@/components/SubmitButton';
import { Form } from '@/components/ui/form';
import { SelectGroup, SelectItem } from '@/components/ui/select';
import {
  createAppointment,
  updateAppointment,
} from '@/lib/actions/appointment.actions';
import { DOCTORS } from '@/lib/constants/doctors';
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from '@/lib/validation/appointment.schemas';
import { useRouter } from 'next/navigation';

type Props = {
  userId: string;
  patientId: string;
  primaryPhysician: string;
  mode?: 'create' | 'update';
  appointmentId?: string;
  initialValues?: Partial<
    Pick<
      AppointmentFormValues,
      'primaryPhysician' | 'reason' | 'schedule' | 'note'
    >
  >;
};

function AppointmentForm({
  userId,
  patientId,
  primaryPhysician,
  mode = 'create',
  appointmentId,
  initialValues,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null,
  );
  const isUpdateMode = mode === 'update';
  const appointmentMinDate = new Date();
  const router = useRouter();

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      userId,
      patient: patientId,
      primaryPhysician: initialValues?.primaryPhysician ?? primaryPhysician,
      reason: initialValues?.reason ?? '',
      schedule: initialValues?.schedule,
      note: initialValues?.note ?? '',
    },
  });

  const onSubmit = async (values: AppointmentFormValues) => {
    setIsLoading(true);
    setSubmissionMessage(null);

    try {
      if (isUpdateMode) {
        if (!appointmentId) {
          throw new Error('Appointment ID is required for update mode.');
        }

        const updatedAppointment = await updateAppointment({
          appointmentId,
          userId: values.userId,
          patientId: values.patient,
          primaryPhysician: values.primaryPhysician,
          reason: values.reason,
          schedule: values.schedule,
          note: values.note,
        });

        if (!updatedAppointment) {
          setSubmissionMessage('Unable to update appointment request.');
          return;
        }

        router.push(
          `/patients/${userId}/appointments/${updatedAppointment.$id}/success?action=updated`,
        );
      } else {
        const appointment = await createAppointment({
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

        if (appointment) {
          router.push(
            `/patients/${userId}/appointments/${appointment.$id}/success?action=created`,
          );
        }
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
      setSubmissionMessage(
        isUpdateMode
          ? 'Unable to update appointment request.'
          : 'Unable to submit appointment request.',
      );
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
          <h2 className="header text-light-200">
            {isUpdateMode ? 'Update appointment' : 'Hey there'}{' '}
            {!isUpdateMode && '\u{1F44B}'}
          </h2>
          <p className="text-16-regular text-dark-700">
            {isUpdateMode
              ? 'Change the details for this appointment request'
              : 'Request a new appointment in 10 seconds'}
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
          minDate={appointmentMinDate}
        />

        {submissionMessage && (
          <p className="text-14-medium text-dark-700" role="status">
            {submissionMessage}
          </p>
        )}

        <SubmitButton isLoading={isLoading}>
          {isUpdateMode ? 'Save changes' : 'Submit and continue'}
        </SubmitButton>
      </form>
    </Form>
  );
}

export default AppointmentForm;
