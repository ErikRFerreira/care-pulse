export type SearchParamProps = {
  params: Promise<{ [key: string]: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
export type Gender = 'Male' | 'Female' | 'Other';
export type Status = 'pending' | 'scheduled' | 'cancelled';
