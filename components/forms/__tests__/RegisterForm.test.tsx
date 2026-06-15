import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RegisterForm from '../RegisterForm';
import { registerPatient } from '@/lib/actions/patient.actions';
import type { User } from '@/types';

vi.mock('next/image', () => ({
  default: ({
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ''} {...props} />
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/actions/patient.actions', () => ({
  registerPatient: vi.fn(),
}));

const pushMock = vi.fn();
const registerPatientMock = vi.mocked(registerPatient);
const useRouterMock = vi.mocked(useRouter);

const testUser: User = {
  $id: 'user-456',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+15551234567',
};

async function selectOption(label: RegExp, optionName: RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('RegisterForm', () => {
  beforeEach(() => {
    pushMock.mockClear();
    registerPatientMock.mockReset();
    useRouterMock.mockReturnValue({
      push: pushMock,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it('renders registration sections and pre-populates user details', () => {
    render(<RegisterForm user={testUser} />);

    expect(screen.getByText(/personal information/i)).toBeInTheDocument();
    expect(screen.getByText(/medical information/i)).toBeInTheDocument();
    expect(
      screen.getByText(/identification and verification/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/consent and privacy/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/full name/i)).toHaveValue(testUser.name);
    expect(screen.getByLabelText(/email address/i)).toHaveValue(
      testUser.email,
    );
    expect(screen.getByLabelText(/^phone number$/i)).toHaveValue(
      '+1 555 123 4567',
    );
  });

  it('uploads an identification image and shows the selected file name', async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterForm user={testUser} />);

    const file = new File(['license'], 'license.png', { type: 'image/png' });
    await user.upload(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      file,
    );

    expect(await screen.findByText('license.png')).toBeInTheDocument();
    expect(screen.getByText(/click to replace/i)).toBeInTheDocument();
  });

  it('submits valid registration data and navigates to the appointment page', async () => {
    const user = userEvent.setup();
    registerPatientMock.mockResolvedValue({ $id: 'patient-789' });

    const { container } = render(<RegisterForm user={testUser} />);

    await user.clear(screen.getByLabelText(/^address$/i));
    await user.type(screen.getByLabelText(/^address$/i), '123 Main Street');
    await user.type(screen.getByLabelText(/occupation/i), 'Engineer');
    await user.type(
      screen.getByLabelText(/emergency contact name/i),
      'John Doe',
    );
    await user.type(
      screen.getByLabelText(/emergency phone number/i),
      '+15557654321',
    );
    await user.type(
      screen.getByLabelText(/insurance provider/i),
      'BlueCross',
    );
    await user.type(
      screen.getByLabelText(/insurance policy number/i),
      'ABC1234567',
    );
    await user.type(screen.getByLabelText(/allergies/i), 'Peanuts');
    await user.type(screen.getByLabelText(/current medications/i), 'Ibuprofen');

    await user.type(screen.getByLabelText(/date of birth/i), '01/15/1990');
    await user.click(screen.getByRole('button', { name: /^female$/i }));
    await selectOption(/primary care physician/i, /dr\. michael lee/i);

    const file = new File(['passport'], 'passport.png', { type: 'image/png' });
    await user.upload(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      file,
    );

    const consentSection = screen.getByText(/consent and privacy/i).closest(
      'section',
    );
    expect(consentSection).not.toBeNull();

    const consentCheckboxes = within(consentSection!).getAllByRole('checkbox');
    for (const checkbox of consentCheckboxes) {
      await user.click(checkbox);
    }

    await user.click(
      screen.getByRole('button', { name: /submit and continue/i }),
    );

    await waitFor(() => {
      expect(registerPatientMock).toHaveBeenCalledTimes(1);
    });

    expect(registerPatientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: testUser.$id,
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        gender: 'Female',
        address: '123 Main Street',
        occupation: 'Engineer',
        emergencyContactName: 'John Doe',
        emergencyContactNumber: '+15557654321',
        primaryPhysician: 'Dr. Michael Lee',
        insuranceProvider: 'BlueCross',
        insurancePolicyNumber: 'ABC1234567',
        allergies: 'Peanuts',
        currentMedication: 'Ibuprofen',
        treatmentConsent: true,
        disclosureConsent: true,
        privacyConsent: true,
      }),
    );
    expect(registerPatientMock.mock.calls[0][0].birthDate).toBeInstanceOf(Date);
    expect(
      registerPatientMock.mock.calls[0][0].identificationDocument,
    ).toBeInstanceOf(FormData);
    expect(pushMock).toHaveBeenCalledWith(
      `/patients/${testUser.$id}/new-appointment`,
    );
  }, 10000);
});
