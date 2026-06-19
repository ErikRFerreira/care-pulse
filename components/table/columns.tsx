'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Check, Hourglass, X } from 'lucide-react';
import Image from 'next/image';

import { DOCTORS } from '@/lib/constants/doctors';
import { cn, formatDateTime } from '@/lib/utils';
import type { AppointmentListRow } from '@/types/appointment.types';
import type { Status } from '@/types/common.types';
import { AppointmentModal } from '../AppointmentModal';
import { CancelAppointmentModal } from '../CancelAppointmentModal';

const statusConfig: Record<
  Status,
  {
    label: string;
    className: string;
    Icon: typeof Check;
  }
> = {
  scheduled: {
    label: 'Scheduled',
    className: 'bg-green-600 text-green-500',
    Icon: Check,
  },
  pending: {
    label: 'Pending',
    className: 'bg-blue-600 text-blue-500',
    Icon: Hourglass,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-600 text-red-500',
    Icon: X,
  },
};

const avatarColors = [
  'bg-green-500 text-black-900',
  'bg-blue-500 text-black-900',
  'bg-purple-300 text-black-900',
  'bg-lime-200 text-black-900',
  'bg-fuchsia-300 text-black-900',
];

const getPatientName = (appointment: AppointmentListRow) =>
  typeof appointment.patient === 'string'
    ? 'Unknown Patient'
    : appointment.patient.name;

const getInitials = (name: string) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return initials || 'P';
};

export const columns: ColumnDef<AppointmentListRow>[] = [
  {
    accessorKey: 'patient',
    header: 'Patient',
    cell: ({ row }) => {
      const patientName = getPatientName(row.original);

      return (
        <div className="flex min-w-52 items-center gap-3">
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full text-14-medium',
              avatarColors[row.index % avatarColors.length],
            )}
          >
            {getInitials(patientName)}
          </span>
          <span className="truncate text-14-medium text-light-200">
            {patientName}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'schedule',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-14-regular text-dark-700">
        {formatDateTime(row.original.schedule).dateOnly}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const { Icon, label, className } = statusConfig[status];

      return (
        <span className={cn('status-badge px-2.5 py-1', className)}>
          <Icon className="size-3.5" aria-hidden="true" />
          <span className="text-12-semibold">{label}</span>
        </span>
      );
    },
  },
  {
    accessorKey: 'primaryPhysician',
    header: 'Doctor',
    cell: ({ row }) => {
      const doctorName = row.original.primaryPhysician;
      const doctor = DOCTORS.find(({ name }) => name === doctorName);

      return (
        <div className="flex min-w-56 items-center gap-3">
          {doctor ? (
            <Image
              src={doctor.image}
              alt={doctor.name}
              width={32}
              height={32}
              className="size-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-light-200 text-14-medium text-black-900">
              {getInitials(doctorName)}
            </span>
          )}
          <span className="truncate text-14-medium text-light-200">
            {doctorName}
          </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const appointment = row.original;

      return (
        <div className="flex items-center gap-4">
          {appointment.status === 'pending' && (
            <AppointmentModal appointment={appointment} />
          )}
          {appointment.status !== 'cancelled' && (
            <CancelAppointmentModal appointment={appointment} />
          )}
        </div>
      );
    },
  },
];
