import StatCard from '@/components/StatCard';
import Image from 'next/image';
import Link from 'next/link';

function Admin() {
  return (
    <div className="mx-auto flex max-w-7x flex-col space-y-14">
      <header className="admin-header">
        <Link href="/" className="cursor-pointer">
          <Image
            src="/assets/icons/logo-full.svg"
            alt="Logo"
            width={32}
            height={162}
            className="h-8 w-fit"
          />
        </Link>
      </header>

      <main className="admin-main">
        <section className="w-full space-y-4 text-dark-700">
          <h1 className="header ">Welcome</h1>
          <p>Start managing your content here.</p>
        </section>

        <section className="admin-stat">
          <StatCard
            type="appointments"
            count={5}
            label="Scheduled Appointments"
            icon="/assets/icons/appointments.svg"
          />
          <StatCard
            type="pending"
            count={10}
            label="Pending Appointments"
            icon="/assets/icons/pending.svg"
          />
          <StatCard
            type="cancelled"
            count={2}
            label="Cancelled Appointments"
            icon="/assets/icons/cancelled.svg"
          />
        </section>
      </main>
    </div>
  );
}

export default Admin;
