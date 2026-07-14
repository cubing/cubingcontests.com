-- Set event ID in the WHERE clause to the event you're interested in

SELECT
  DATE_TRUNC('month', contests.start_date) AS month,
  COUNT(DISTINCT contests.competition_id) AS times_held
FROM record_ranks.rounds
INNER JOIN record_ranks.events
  ON events.event_id = rounds.event_id
INNER JOIN record_ranks.contests
  ON contests.competition_id = rounds.competition_id
WHERE events.event_id = ''
  AND (contests.state = 'finished' OR contests.state = 'published')
GROUP BY month
ORDER BY month DESC;