'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Form } from '@/components/ui/form';
import SubmitButton from '../SubmitButton';
import CustomFormField, { FormFieldType } from '../CustomFormField';
import { createUser } from '@/lib/actions/patient.actions';
import { useRouter } from 'next/navigation';

const phoneRegex = /^\+?[0-9\s().-]{7,20}$/;

const formSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .regex(phoneRegex, 'Enter a valid phone number.'),
});

type PatientFormValues = z.infer<typeof formSchema>;

function PatientForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = async ({ name, email, phone }: PatientFormValues) => {
    setIsLoading(true);

    try {
      const userData = { name, email, phone };

      const user = await createUser(userData);
      if (user) router.push(`/patients/${user.$id}/register`);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6">
        <section className="mb-8 space-y-4">
          <h2 className="text-dark-700">
            Please enter your details to get started.
          </h2>
        </section>

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="name"
          label="Full name"
          placeholder="John Doe"
          iconSrc="/assets/icons/user.svg"
          iconAlt="user"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="email"
          label="Email"
          placeholder="johndoe@gmail.com"
          iconSrc="/assets/icons/email.svg"
          iconAlt="email"
        />

        <CustomFormField
          fieldType={FormFieldType.PHONE_INPUT}
          control={form.control}
          name="phone"
          label="Phone number"
          placeholder="(555) 123-4567"
        />

        <SubmitButton isLoading={isLoading}>Get Started</SubmitButton>
      </form>
    </Form>
  );
}

export default PatientForm;
