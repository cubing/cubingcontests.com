with stats as (
  select
    events.name,
    (
      select count(distinct contests.competition_id) from record_ranks.rounds
      inner join record_ranks.contests
        on contests.competition_id = rounds.competition_id
      where event_id = events.event_id
        and (contests.state = 'finished' or contests.state = 'published')
    ) as times_held,
    (
      select count(distinct contests.competition_id) from record_ranks.rounds
      inner join record_ranks.contests
        on contests.competition_id = rounds.competition_id
      inner join record_ranks.regions
        on regions.code = contests.region_code
      where event_id = events.event_id
        and super_region_code = 'XE'
        and (contests.state = 'finished' or contests.state = 'published')
    ) as europe,
    (
      select count(distinct contests.competition_id) from record_ranks.rounds
      inner join record_ranks.contests
        on contests.competition_id = rounds.competition_id
      inner join record_ranks.regions
        on regions.code = contests.region_code
      where event_id = events.event_id
        and super_region_code = 'XA'
        and (contests.state = 'finished' or contests.state = 'published')
    ) as asia,
    (
      select count(distinct contests.competition_id) from record_ranks.rounds
      inner join record_ranks.contests
        on contests.competition_id = rounds.competition_id
      inner join record_ranks.regions
        on regions.code = contests.region_code
      where event_id = events.event_id
        and super_region_code = 'XN'
        and (contests.state = 'finished' or contests.state = 'published')
    ) as north_america,
    (
      select count(distinct contests.competition_id) from record_ranks.rounds
      inner join record_ranks.contests
        on contests.competition_id = rounds.competition_id
      inner join record_ranks.regions
        on regions.code = contests.region_code
      where event_id = events.event_id
        and super_region_code = 'XS'
        and (contests.state = 'finished' or contests.state = 'published')
    ) as south_america,
    (
      select count(distinct contests.competition_id) from record_ranks.rounds
      inner join record_ranks.contests
        on contests.competition_id = rounds.competition_id
      inner join record_ranks.regions
        on regions.code = contests.region_code
      where event_id = events.event_id
        and super_region_code = 'XF'
        and (contests.state = 'finished' or contests.state = 'published')
    ) as africa,
    (
      select count(distinct contests.competition_id) from record_ranks.rounds
      inner join record_ranks.contests
        on contests.competition_id = rounds.competition_id
      inner join record_ranks.regions
        on regions.code = contests.region_code
      where event_id = events.event_id
        and super_region_code = 'XO'
        and (contests.state = 'finished' or contests.state = 'published')
    ) as oceania,
    (
      select count(distinct contests.competition_id) from record_ranks.rounds
      inner join record_ranks.contests
        on contests.competition_id = rounds.competition_id
      where event_id = events.event_id
        and contests.type = 'wca-comp'
        and (contests.state = 'finished' or contests.state = 'published')
    ) as wca_comps,
    (
      select count(distinct contests.competition_id) from record_ranks.rounds
      inner join record_ranks.contests
        on contests.competition_id = rounds.competition_id
      where event_id = events.event_id
        and contests.type = 'comp'
        and (contests.state = 'finished' or contests.state = 'published')
    ) as unoff_comps,
    (
      select count(distinct contests.competition_id) from record_ranks.rounds
      inner join record_ranks.contests
        on contests.competition_id = rounds.competition_id
      where event_id = events.event_id
        and contests.type = 'meetup'
        and (contests.state = 'finished' or contests.state = 'published')
    ) as meetups
  from record_ranks.events
)
select * from stats
where times_held > 0
order by times_held desc