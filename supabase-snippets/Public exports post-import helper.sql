-- Run this script after importing CSV files from a public export. It adds back the constraints for the id column.

ALTER TABLE record_ranks.events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE record_ranks.events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
SELECT SETVAL('record_ranks.events_id_seq', COALESCE((SELECT MAX(id) FROM record_ranks.events), 1));

ALTER TABLE record_ranks.persons ADD CONSTRAINT persons_pkey PRIMARY KEY (id);
ALTER TABLE record_ranks.persons ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
SELECT SETVAL('record_ranks.persons_id_seq', COALESCE((SELECT MAX(id) FROM record_ranks.persons), 1));

ALTER TABLE record_ranks.contests ADD CONSTRAINT contests_pkey PRIMARY KEY (id);
ALTER TABLE record_ranks.contests ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
SELECT SETVAL('record_ranks.contests_id_seq', COALESCE((SELECT MAX(id) FROM record_ranks.contests), 1));

ALTER TABLE record_ranks.rounds ADD CONSTRAINT rounds_pkey PRIMARY KEY (id);
ALTER TABLE record_ranks.rounds ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
SELECT SETVAL('record_ranks.rounds_id_seq', COALESCE((SELECT MAX(id) FROM record_ranks.rounds), 1));

ALTER TABLE record_ranks.results ADD CONSTRAINT results_pkey PRIMARY KEY (id);
ALTER TABLE record_ranks.results ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
SELECT SETVAL('record_ranks.results_id_seq', COALESCE((SELECT MAX(id) FROM record_ranks.results), 1));