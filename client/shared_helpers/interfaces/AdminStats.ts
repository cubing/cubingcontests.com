export interface IAdminStats {
  totalPersons: number;
  totalUsers: number;
  totalResults: number;
  totalUnapprovedSubmittedResults: number;
  analytics: {
    getContests: number;
    getModContests: number;
    getContest: number;
    getModContest: number;
    createContest: number;
    updateContest: number;
    updateContestState: number;
    createPerson: number;
    createEvent: number;
    updateEvent: number;
    getRankings: number;
    getRecords: number;
    createResult: number;
    deleteResult: number;
    submitResult: number;
    updateResult: number;
    updateRecordTypes: number;
    createUser: number;
    updateUser: number;
  };
}
