import StatCard from '@/components/StatCard';
import { columns } from '@/components/table/columns';
import { DataTable } from '@/components/table/DataTable';
import { getRecentApppointmetList } from '@/lib/actions/appointment.actions';
import Image from 'next/image';
import Link from 'next/link';
import { connection } from 'next/server';

async function Admin() {
  await connection();

  const appointments = await getRecentApppointmetList();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-14">
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
        <section className="flex w-full flex-col gap-4 text-dark-700">
          <h1 className="header">Welcome</h1>
          <p>Start managing your content here.</p>
        </section>

        <section className="admin-stat">
          <StatCard
            type="appointments"
            count={appointments.totalCount}
            label="Scheduled Appointments"
            icon="/assets/icons/appointments.svg"
          />
          <StatCard
            type="pending"
            count={appointments.pending}
            label="Pending Appointments"
            icon="/assets/icons/pending.svg"
          />
          <StatCard
            type="cancelled"
            count={appointments.cancelled}
            label="Cancelled Appointments"
            icon="/assets/icons/cancelled.svg"
          />
        </section>

        <DataTable data={appointments.documents} columns={columns} />
      </main>
    </div>
  );
}

export default Admin;
