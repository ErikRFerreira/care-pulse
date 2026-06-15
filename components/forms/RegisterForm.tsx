'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import CustomFormField, { FormFieldType } from '@/components/CustomFormField';
import SubmitButton from '@/components/SubmitButton';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { SelectGroup, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  GENDER_OPTIONS,
  registerFormSchema,
  type RegisterFormValues,
} from '@/lib/validation/patient.schemas';
import type { User } from '@/types';
import { useRouter } from 'next/navigation';
import { registerPatient } from '@/lib/actions/patient.actions';

const DOCTORS = [
  {
    name: 'Dr. Adam Smith',
    image: '/assets/images/dr-green.png',
  },
  {
    name: 'Dr. Emily Johnson',
    image: '/assets/images/dr-cameron.png',
  },
  {
    name: 'Dr. Michael Lee',
    image: '/assets/images/dr-lee.png',
  },
  {
    name: 'Dr. Sarah Livingston',
    image: '/assets/images/dr-livingston.png',
  },
];

const IDENTIFICATION_TYPES = [
  'Birth Certificate',
  'Driver License',
  'Medical Insurance Card',
  'National Identity Card',
  'Passport',
  'Student ID Card',
];

const BIRTH_DATE_MIN = new Date(1900, 0, 1);
const BIRTH_DATE_MAX = new Date();

type Props = {
  user: User;
};

function RegisterForm({ user }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [identificationFile, setIdentificationFile] = useState<File | null>(
    null,
  );
  const identificationInputId = useId();
  const identificationInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const identificationPreviewUrl = useMemo(() => {
    if (!identificationFile?.type.startsWith('image/')) return null;

    return URL.createObjectURL(identificationFile);
  }, [identificationFile]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      userId: user?.$id ?? '',
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      birthDate: undefined,
      gender: undefined,
      address: '',
      occupation: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      primaryPhysician: '',
      insuranceProvider: '',
      insurancePolicyNumber: '',
      allergies: '',
      currentMedication: '',
      familyMedicalHistory: '',
      pastMedicalHistory: '',
      identificationType: '',
      identificationNumber: '',
      identificationDocument: undefined,
      treatmentConsent: false,
      disclosureConsent: false,
      privacyConsent: false,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);

    let formData;

    // Handle file input for identification document
    const identificationDocument = values.identificationDocument?.get(
      'identificationDocument',
    );

    // If the identification document is a File, convert it to a Blob and append it to FormData
    if (identificationDocument instanceof File) {
      const blobfile = new Blob([identificationDocument], {
        type: identificationDocument.type,
      });

      formData = new FormData();
      formData.append('blob', blobfile);
      formData.append('name', identificationDocument.name);
    }

    try {
      // Send to Appwrite
      const patiendData = {
        ...values,
        userId: user.$id,
        birthDate: values.birthDate!,
        identificationDocument: formData,
      };

      const patient = await registerPatient(patiendData);
      if (patient) router.push(`/patients/${user.$id}/new-appointment`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!identificationPreviewUrl) return;

    return () => URL.revokeObjectURL(identificationPreviewUrl);
  }, [identificationPreviewUrl]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-4"
      >
        <section className="flex flex-col gap-4">
          <p className="text-dark-700">Let us know more about yourself</p>
        </section>

        <section className="flex flex-col gap-6">
          <h3 className="sub-header text-dark-700">Personal Information</h3>

          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="name"
            label="Full name"
            placeholder="ex: Adam"
          />

          <div className="flex flex-col gap-6 xl:flex-row">
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="email"
              label="Email address"
              placeholder="adrian@jsmastery.pro"
              iconSrc="/assets/icons/email.svg"
              iconAlt="email"
            />

            <CustomFormField
              fieldType={FormFieldType.PHONE_INPUT}
              control={form.control}
              name="phone"
              label="Phone number"
              placeholder="+00 0342 0453 34"
            />
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <CustomFormField
              fieldType={FormFieldType.DATE_PICKER}
              control={form.control}
              name="birthDate"
              label="Date of birth"
              placeholder="Select your birth date"
              dateFormat="dd/MM/yyyy"
              showMonthDropdown
              showYearDropdown
              minDate={BIRTH_DATE_MIN}
              maxDate={BIRTH_DATE_MAX}
            />

            <CustomFormField
              fieldType={FormFieldType.SKELETON}
              control={form.control}
              name="gender"
              label="Gender"
              renderSkeleton={(field) => (
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => field.onChange(gender)}
                      className="radio-group"
                    >
                      <span
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full border border-dark-500',
                          field.value === gender && 'border-green-500',
                        )}
                      >
                        <span
                          className={cn(
                            'size-2 rounded-full bg-transparent',
                            field.value === gender && 'bg-green-500',
                          )}
                        />
                      </span>
                      <span className="text-14-medium text-dark-700">
                        {gender}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="address"
              label="Address"
              placeholder="ex: 14 street, New York, NY - 5101"
            />

            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="occupation"
              label="Occupation"
              placeholder="Software Engineer"
            />
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="emergencyContactName"
              label="Emergency contact name"
              placeholder="Guardian's name"
            />

            <CustomFormField
              fieldType={FormFieldType.PHONE_INPUT}
              control={form.control}
              name="emergencyContactNumber"
              label="Emergency Phone number"
              placeholder="ex: +1 (868) 579-9831"
            />
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h3 className="sub-header text-dark-700">Medical Information</h3>

          <CustomFormField
            fieldType={FormFieldType.SELECT}
            control={form.control}
            name="primaryPhysician"
            label="Primary care physician"
            placeholder="Select a physician"
          >
            <SelectGroup>
              {DOCTORS.map((doctor) => (
                <SelectItem key={doctor.name} value={doctor.name}>
                  <div className="flex items-center gap-2">
                    <Image
                      src={doctor.image}
                      alt={doctor.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span>{doctor.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </CustomFormField>

          <div className="flex flex-col gap-6 xl:flex-row">
            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="insuranceProvider"
              label="Insurance provider"
              placeholder="ex: BlueCross"
            />

            <CustomFormField
              fieldType={FormFieldType.INPUT}
              control={form.control}
              name="insurancePolicyNumber"
              label="Insurance policy number"
              placeholder="ex: ABC1234567"
            />
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="allergies"
              label="Allergies (if any)"
              placeholder="ex: Peanuts, Penicillin, Pollen"
            />

            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="currentMedication"
              label="Current medications"
              placeholder="ex: Ibuprofen 200mg, Levothyroxine 50mcg"
            />
          </div>

          <div className="flex flex-col gap-6 xl:flex-row">
            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="familyMedicalHistory"
              label="Family medical history (if relevant)"
              placeholder="ex: Mother had breast cancer"
            />

            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="pastMedicalHistory"
              label="Past medical history"
              placeholder="ex: Asthma diagnosis in childhood"
            />
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h3 className="sub-header text-dark-700">
            Identification and Verification
          </h3>

          <CustomFormField
            fieldType={FormFieldType.SELECT}
            control={form.control}
            name="identificationType"
            label="Identification type"
            placeholder="Select identification type"
          >
            <SelectGroup>
              {IDENTIFICATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectGroup>
          </CustomFormField>

          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name="identificationNumber"
            label="Identification Number"
            placeholder="ex 1234567"
          />

          <CustomFormField
            fieldType={FormFieldType.SKELETON}
            control={form.control}
            name="identificationDocument"
            label="Scanned Copy of Identification Document"
            renderSkeleton={(field) => {
              const clearIdentificationDocument = () => {
                setIdentificationFile(null);
                field.onChange(undefined);

                if (identificationInputRef.current) {
                  identificationInputRef.current.value = '';
                }
              };

              return (
                <div className="file-upload">
                  <input
                    ref={identificationInputRef}
                    id={identificationInputId}
                    type="file"
                    className="hidden"
                    accept="image/svg+xml,image/png,image/jpeg,image/gif"
                    multiple={false}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;

                      const formData = new FormData();
                      formData.append('identificationDocument', file);
                      field.onChange(formData);
                      setIdentificationFile(file);
                    }}
                  />

                  <label
                    htmlFor={identificationInputId}
                    className="flex w-full cursor-pointer flex-col items-center justify-center gap-3"
                  >
                    {identificationPreviewUrl ? (
                      <Image
                        src={identificationPreviewUrl}
                        alt={identificationFile?.name ?? 'Identification file'}
                        width={320}
                        height={160}
                        unoptimized
                        className="max-h-40 w-full rounded-md object-contain"
                      />
                    ) : identificationFile ? (
                      <div className="flex size-20 items-center justify-center rounded-md border border-dark-500 bg-dark-300">
                        <ImageIcon className="size-8 text-dark-600" />
                      </div>
                    ) : (
                      <Image
                        src="/assets/icons/upload.svg"
                        alt="upload"
                        width={40}
                        height={40}
                      />
                    )}

                    <div className="file-upload_label">
                      {identificationFile ? (
                        <>
                          <p className="max-w-full truncate text-light-200">
                            {identificationFile.name}
                          </p>
                          <p>
                            <span className="text-green-500">
                              Click to replace
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            <span className="text-green-500">
                              Click to upload
                            </span>{' '}
                            or drag and drop
                          </p>
                          <p>SVG, PNG, JPG or GIF (max. 800x400px)</p>
                        </>
                      )}
                    </div>
                  </label>

                  {identificationFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-500"
                      onClick={clearIdentificationDocument}
                    >
                      <X data-icon="inline-start" />
                      Remove
                    </Button>
                  )}
                </div>
              );
            }}
          />
        </section>

        <section className="flex flex-col gap-6">
          <h3 className="sub-header text-dark-700">Consent and Privacy</h3>

          <div className="flex flex-col gap-4">
            <CustomFormField
              fieldType={FormFieldType.CHECKBOX}
              control={form.control}
              name="treatmentConsent"
              label="I consent to receive treatment for my health condition."
            />

            <CustomFormField
              fieldType={FormFieldType.CHECKBOX}
              control={form.control}
              name="disclosureConsent"
              label="I consent to the use and disclosure of my health information for treatment purposes."
            />

            <CustomFormField
              fieldType={FormFieldType.CHECKBOX}
              control={form.control}
              name="privacyConsent"
              label="I acknowledge that I have reviewed and agree to the privacy policy"
            />
          </div>
        </section>

        <SubmitButton isLoading={isLoading}>Submit and continue</SubmitButton>
      </form>
    </Form>
  );
}

export default RegisterForm;
