export type SearchParamProps = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export type Gender = 'Male' | 'Female' | 'Other';
export type Status = 'pending' | 'scheduled' | 'cancelled';
