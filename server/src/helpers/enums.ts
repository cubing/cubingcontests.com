export enum LogType {
  Generic = "generic",
  Error = "error",
  Warning = "warn",

  GetContests = "get_contests",
  GetModContests = "get_mod_contests",
  GetContest = "get_contest",
  GetModContest = "get_mod_contest",
  CreateContest = "create_contest",
  OpenRound = "open_round",
  UpdateContest = "update_contest",
  UpdateContestState = "update_contest_state",
  RemoveContest = "remove_contest",

  GetModPersons = "get_mod_persons",
  CreatePerson = "create_person",
  UpdatePerson = "update_person",
  ApprovePersons = "approve_persons",
  DeletePerson = "delete_person",

  CreateEvent = "create_event",
  UpdateEvent = "update_event",

  GetRankings = "get_rankings",
  GetRecords = "get_records",
  CreateResult = "create_result",
  DeleteResult = "delete_result",
  SubmitResult = "submit_result",
  UpdateResult = "update_result",

  UpdateRecordTypes = "update_record_types",

  Register = "register",
  ConfirmEmail = "confirm_email",
  CreateUser = "create_user",
  UpdateUser = "update_user",
  RequestPasswordReset = "request_password_reset",
  ResetPassword = "reset_password",
  DeleteUser = "delete_user",

  StartNewSolution = "start_new_solution",

  EnterAttemptFromExtDevice = "enter_ext_attempt",
  EnterResultsFromExtDevice = "enter_ext_results",
  DebugEmail = "debug_email",
  AccessDenied = "access_denied",
}
