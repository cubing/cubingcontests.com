-- This query won't work in SQL Editor. Copy it to the editor in Supabase Logs and run it on the Edge Functions sink.

-- This query gets RecordRanks logs. It can also be modified slightly to filter by a specific error code
select id, timestamp, event_message, metadata from function_edge_logs where metadata->>'rr_code' is not null order by timestamp desc limit 100;