import { User } from '@/types';

type Props = {
  user: User | null;
};

async function RegisterForm({ user }: Props) {
  return <div>RegisterForm</div>;
}

export default RegisterForm;
