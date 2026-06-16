import Image from 'next/image';
import { Calendar, Check } from 'lucide-react';
import { notFound } from 'next/navigation';

import { DOCTORS } from '@/lib/constants/doctors';
import { formatDateTime } from '@/lib/utils';
import {
  getAppointmentById,
  getPatientByUserId,
  getUserById,
} from '@/lib/actions/patient.actions';

type SuccessAction = 'created' | 'updated';

type Props = {
  params: Promise<{
    userId: string;
    appointmentId: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const successCopy: Record<
  SuccessAction,
  {
    emphasizedText: string;
    trailingText: string;
  }
> = {
  created: {
    emphasizedText: 'appointment request',
    trailingText: 'has been successfully submitted!',
  },
  updated: {
    emphasizedText: 'appointment request',
    trailingText: 'has been successfully updated!',
  },
};

const getSuccessAction = (
  action: string | string[] | undefined,
): SuccessAction | null => {
  if (action !== 'created' && action !== 'updated') {
    return null;
  }

  return action;
};

async function AppointmentSuccess({ params, searchParams }: Props) {
  const [{ userId, appointmentId }, search] = await Promise.all([
    params,
    searchParams,
  ]);
  const action = getSuccessAction(search.action);

  if (!action) {
    notFound();
  }

  const [user, patient, appointment] = await Promise.all([
    getUserById(userId),
    getPatientByUserId(userId),
    getAppointmentById(appointmentId),
  ]);

  if (
    !user ||
    !patient ||
    !appointment ||
    (appointment.userId && appointment.userId !== user.$id) ||
    appointment.patientId !== patient.$id
  ) {
    notFound();
  }

  const doctor = DOCTORS.find(
    ({ name }) => name === appointment.primaryPhysician,
  );
  const copy = successCopy[action];

  return (
    <main className="flex min-h-screen bg-dark-300 px-[5%]">
      <section className="sub-container max-w-[750px]">
        <h1 className="mx-auto">
          <Image
            src="/assets/icons/logo-full.svg"
            alt="CarePulse Logo"
            height={1000}
            width={1000}
            className="h-10 w-fit"
          />
        </h1>

        <div className="success-img">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex-center size-16 rounded-full border-4 border-green-500 text-green-500 shadow-[0_0_30px_rgba(36,174,124,0.35)]">
              <Check aria-hidden="true" className="size-9" strokeWidth={3} />
            </div>

            <div className="flex max-w-[520px] flex-col gap-5">
              <h2 className="header text-light-200">
                Your{' '}
                <span className="text-green-500">{copy.emphasizedText}</span>{' '}
                {copy.trailingText}
              </h2>
              <p className="text-16-regular text-dark-700">
                We&apos;ll be in touch shortly to confirm.
              </p>
            </div>
          </div>

          <div className="request-details">
            <p className="sub-header text-dark-700">
              Requested appointment details:
            </p>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-md border border-dark-500 bg-dark-400 px-3 py-2">
                {doctor && (
                  <Image
                    src={doctor.image}
                    alt={doctor.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <p className="text-12-semibold text-light-200">
                  {appointment.primaryPhysician}
                </p>
              </div>

              <div className="flex items-center gap-2 text-dark-700">
                <Calendar aria-hidden="true" className="size-5" />
                <time
                  className="text-16-regular"
                  dateTime={new Date(appointment.schedule).toISOString()}
                >
                  {formatDateTime(appointment.schedule).dateTime}
                </time>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AppointmentSuccess;
