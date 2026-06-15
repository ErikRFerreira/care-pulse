import Image from 'next/image';
import RegisterForm from '@/components/forms/RegisterForm';
import { getUserById } from '@/lib/actions/patient.actions';
import { notFound } from 'next/navigation';

/**
 * Since Next.jS 16,
 * dynamic route params are now Promises that need to be awaited before use.
 */
type Props = {
  params: Promise<{
    userId: string;
  }>;
};

async function Register({ params }: Props) {
  const { userId } = await params;
  const user = await getUserById(userId);

  if (!user) {
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

          <RegisterForm user={user} />

          <div className="text-14-regular mt-20 flex justify-between pb-10">
            <p className="justify-items-end text-dark-600 xl:text-left">
              © {new Date().getFullYear()} CarePulse. All rights reserved.
            </p>
          </div>
        </div>
      </section>

      <Image
        src="/assets/images/register-img.png"
        height={1000}
        width={1000}
        alt="Patient"
        className="side-img max-w-97.5"
      />
    </div>
  );
}

export default Register;
