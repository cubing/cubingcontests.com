import { defaultPreparePayload } from "pino-logflare";

// RESTART THE DEV ENVIRONMENT AFTER EDITING THIS FILE!

export const handlePayload = (events, meta) => {
  // The `meta` arg contains cleaned information of raw payload.
  // You can add in top-level keys via this callback, or completely disable `metadata` key nesting by passing the payload as is, as shown below.
  const item = defaultPreparePayload(events, meta);

  item.appname = "cubingcontests";
  item.metadata = { project_ref: "default", cc_log: "true" };

  return item;
};
