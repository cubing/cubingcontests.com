-- Run this script before importing CSV files from a public export. IT DELETES TABLE DATA and drops the constraints on the id column.

DELETE FROM record_ranks.results;
-- Note that this query also affects tables that have references to this table because of CASCADE
ALTER TABLE record_ranks.results DROP CONSTRAINT results_pkey CASCADE;
ALTER TABLE record_ranks.results ALTER COLUMN id DROP IDENTITY IF EXISTS;

DELETE FROM record_ranks.rounds;
-- Note that this query also affects tables that have references to this table because of CASCADE
ALTER TABLE record_ranks.rounds DROP CONSTRAINT rounds_pkey CASCADE;
ALTER TABLE record_ranks.rounds ALTER COLUMN id DROP IDENTITY IF EXISTS;

DELETE FROM record_ranks.contests;
-- Note that this query also affects tables that have references to this table because of CASCADE
ALTER TABLE record_ranks.contests DROP CONSTRAINT contests_pkey CASCADE;
ALTER TABLE record_ranks.contests ALTER COLUMN id DROP IDENTITY IF EXISTS;

DELETE FROM record_ranks.persons;
-- Note that this query also affects tables that have references to this table because of CASCADE
ALTER TABLE record_ranks.persons DROP CONSTRAINT persons_pkey CASCADE;
ALTER TABLE record_ranks.persons ALTER COLUMN id DROP IDENTITY IF EXISTS;

DELETE FROM record_ranks.events;
-- Note that this query also affects tables that have references to this table because of CASCADE
ALTER TABLE record_ranks.events DROP CONSTRAINT events_pkey CASCADE;
ALTER TABLE record_ranks.events ALTER COLUMN id DROP IDENTITY IF EXISTS;