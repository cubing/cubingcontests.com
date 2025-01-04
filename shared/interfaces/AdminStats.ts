export interface IAdminStats {
  totalPersons: number;
  unapprovedPersons: number;
  totalUsers: number;
  unapprovedUsers: number;
  totalResults: number;
  totalUnapprovedSubmittedResults: number;
  analytics: {
    label: string;
    value: number;
  }[];
}
