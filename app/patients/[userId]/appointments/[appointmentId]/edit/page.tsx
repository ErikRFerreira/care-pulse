import AppointmentForm from '@/components/forms/AppointmentForm';
import {
  getAppointmentById,
  getPatientByUserId,
  getUserById,
} from '@/lib/actions/patient.actions';
import Image from 'next/image';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{
    userId: string;
    appointmentId: string;
  }>;
};

async function EditAppointment({ params }: Props) {
  const { userId, appointmentId } = await params;
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

  return (
    <div className="flex h-screen max-h-screen justify-between">
      <section className="remove-scrollbar container">
        <div className="sub-container max-w-6xl">
          <h1>
            <Image
              src="/assets/icons/logo-full.svg"
              alt="CarePulse Logo"
              height={1000}
              width={1000}
              className="mb-12 h-10 w-fit"
            />
          </h1>

          <AppointmentForm
            mode="update"
            appointmentId={appointment.$id}
            userId={user.$id}
            patientId={patient.$id}
            primaryPhysician={patient.primaryPhysician}
            initialValues={{
              primaryPhysician: appointment.primaryPhysician,
              reason: appointment.reason,
              schedule: new Date(appointment.schedule),
              note: appointment.note,
            }}
          />

          <div className="text-14-regular mt-20 flex justify-between pb-10">
            <p className="justify-items-end text-dark-600 xl:text-left">
              &copy; {new Date().getFullYear()} CarePulse. All rights reserved.
            </p>
          </div>
        </div>
      </section>

      <Image
        src="/assets/images/appointment-img.png"
        height={1000}
        width={1000}
        alt="Appointment"
        className="side-img max-w-[40%]"
      />
    </div>
  );
}

export default EditAppointment;
