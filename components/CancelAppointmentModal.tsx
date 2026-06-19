'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import CancelAppointmentForm from '@/components/forms/CancelAppointmentForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { AppointmentListRow } from '@/types/appointment.types';

type Props = {
  appointment: AppointmentListRow;
};

export function CancelAppointmentModal({ appointment }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-14-medium text-light-200 hover:no-underline cursor-pointer"
        >
          Cancel
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog max-h-[calc(100vh-2rem)] overflow-y-auto p-8 sm:max-w-[552px] sm:p-10">
        <DialogHeader className="gap-3">
          <DialogTitle className="text-24-bold text-light-200">
            Cancel Appointment
          </DialogTitle>
          <DialogDescription className="text-16-regular text-dark-700">
            Are you sure you want to cancel your appointment
          </DialogDescription>
        </DialogHeader>
        <CancelAppointmentForm
          appointment={appointment}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
