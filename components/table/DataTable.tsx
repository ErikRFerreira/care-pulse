import { AppointmentRow } from '@/types/appointment.types';

type Props = {
  columns: React.ReactNode;
  data: AppointmentRow[];
};

function DataTable({ columns, data }: Props) {
  return <div>DataTable</div>;
}

export default DataTable;
