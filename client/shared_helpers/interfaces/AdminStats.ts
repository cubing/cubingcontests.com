export interface IAdminStats {
  totalPersons: number;
  totalUsers: number;
  unconfirmedUsers: number;
  totalResults: number;
  totalUnapprovedSubmittedResults: number;
  analytics: {
    label: string;
    value: number;
  }[];
}
