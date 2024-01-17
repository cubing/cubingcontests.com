export enum LogType {
  Generic = 'generic',
  Error = 'error',
  Warning = 'warn',

  GetContests = 'get_contests',
  GetModContests = 'get_mod_contests',
  GetContest = 'get_contest',
  GetModContest = 'get_mod_contest',
  CreateContest = 'create_contest',
  UpdateContest = 'update_contest',
  UpdateContestState = 'update_contest_state',

  CreatePerson = 'create_person',

  CreateEvent = 'create_event',
  UpdateEvent = 'update_event',

  GetRankings = 'get_rankings',
  GetRecords = 'get_records',
  CreateResult = 'create_result',
  DeleteResult = 'delete_result',
  SubmitResult = 'submit_result',
  UpdateResult = 'update_result',

  UpdateRecordTypes = 'update_record_types',

  CreateUser = 'create_user',
  UpdateUser = 'update_user',

  EnterAttempt = 'enter_attempt',
}
