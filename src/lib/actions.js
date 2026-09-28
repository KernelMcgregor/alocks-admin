// Every manual action the backend exposes. `runLabel` is the audit-log action name the
// backend records it under (the label passed to _start_task), used to show its last run.
export const ACTION_GROUPS = [
  {
    title: 'Pipelines',
    description: 'Multi-step jobs. Start here — the single steps below are for repairs.',
    actions: [
      {
        label: 'Run Full Pipeline', endpoint: '/admin/run-full-pipeline', runLabel: 'Full Pipeline',
        what: 'The same job as the nightly schedule: scrape any new results, rebuild stats and rankings if a card landed, then regenerate predictions and fight previews.',
      },
      {
        label: 'Refresh After Event', endpoint: '/admin/refresh-after-event', runLabel: 'Refresh After Event',
        what: 'Rebuild derived stats → career stats → Glicko ratings + rankings → rank history → similarity from what is already in the database. No scraping.',
      },
    ],
  },
  {
    title: 'Scraping',
    actions: [
      { label: 'Recent Update', endpoint: '/admin/scrape-recent', runLabel: 'Recent Update', what: 'Scrape results for any card newer than the latest one with results, then refresh upcoming cards. Does not rebuild stats.' },
      { label: 'Scrape Upcoming', endpoint: '/admin/scrape-upcoming', runLabel: 'Scrape Upcoming', what: 'Refresh upcoming events and their bouts from ufcstats.com.' },
      { label: 'Fighter Profiles', endpoint: '/admin/scrape-profiles', runLabel: 'Fighter Profiles', what: 'Bio and photo from ufc.com for anyone who fought in the last 60 days or is booked on an upcoming card and is still missing them, then caches the photos. Runs nightly too. Fields you locked on the Fighters page are left alone.' },
      { label: 'Fighter Profiles (whole roster)', endpoint: '/admin/scrape-profiles?recent_days=0', runLabel: 'Fighter Profiles', what: 'The same for every fighter in the database still missing a bio or photo, including retired ones. Slow.' },
      { label: 'Live Odds', endpoint: '/admin/scrape-live-odds', runLabel: 'Live Odds', what: 'Current bookmaker odds for upcoming fights.' },
      { label: 'Bovada Odds', endpoint: '/admin/scrape-bovada', runLabel: 'Bovada Odds', what: 'Method-of-victory odds for upcoming fights.' },
      { label: 'Prediction Markets', endpoint: '/admin/scrape-prediction-markets', runLabel: 'Prediction Markets (both)', what: 'Kalshi and Polymarket quotes and price history for open fights.' },
      { label: 'Historical Odds', endpoint: '/admin/scrape-historical-odds', runLabel: 'Historical Odds (since 2022)', what: 'Backfill bookmaker odds since 2022. Slow.' },
      { label: 'Full Scrape', endpoint: '/admin/scrape?mode=full', runLabel: 'Scrape (full)', what: 'Re-scrape every fighter, event and fight from ufcstats.com. Takes hours; only for rebuilding the database.', danger: true },
      { label: 'Update Scrape', endpoint: '/admin/scrape?mode=update', runLabel: 'Scrape (update)', what: 'Scrape new events only.' },
    ],
  },
  {
    title: 'Cleanup',
    actions: [
      { label: 'Reconcile Fights (dry run)', endpoint: '/admin/reconcile-fights', runLabel: 'Reconcile Fights (dry run)', what: 'Report bouts that are no longer on their ufcstats card, without deleting anything.' },
      { label: 'Reconcile Fights', endpoint: '/admin/reconcile-fights?apply=true', runLabel: 'Reconcile Fights', what: 'Delete bouts that were pulled from their card (never ones with a recorded winner), then regenerate what depended on them.', danger: true },
    ],
  },
  {
    title: 'Stats & Rankings',
    actions: [
      { label: 'Derived Fight Stats', endpoint: '/admin/generate-derived-stats', runLabel: 'Derived Fight Stats', what: 'Per-fight rate stats (per-minute, accuracy, defence).' },
      { label: 'Career Stats', endpoint: '/admin/generate-career-stats', runLabel: 'Career Stats', what: 'Career aggregates per fighter, from the derived stats.' },
      { label: 'Glicko Ratings only', endpoint: '/admin/generate-glicko', runLabel: 'Generate Glicko Ratings', what: 'Recompute Glicko ratings and snapshots without publishing rankings.' },
      { label: 'Glicko Ratings + Rankings', endpoint: '/admin/generate-rankings', runLabel: 'Glicko Ratings + Rankings', what: 'Replay Glicko ratings over all of history, then publish the rankings.' },
      { label: 'Fighter Similarity', endpoint: '/admin/generate-similarity', runLabel: 'Fighter Similarity', what: 'Style-similarity scores between fighters.' },
    ],
  },
  {
    title: 'Models & Predictions',
    actions: [
      { label: 'Generate Predictions', endpoint: '/admin/generate-predictions', runLabel: 'Generate Predictions', what: 'Winner predictions for upcoming fights.' },
      { label: 'Method Predictions', endpoint: '/admin/generate-method-predictions', runLabel: 'Method Predictions', what: 'KO / submission / decision predictions for upcoming fights.' },
      { label: 'Train Winner Model', endpoint: '/admin/train-model', runLabel: 'Train Winner Model', what: 'Retrain the winner model. Changes every future prediction.', danger: true },
      { label: 'Train Method Model', endpoint: '/admin/train-method-model', runLabel: 'Train Method Model', what: 'Retrain the method classifier.', danger: true },
    ],
  },
  {
    title: 'Previews',
    actions: [
      { label: 'Generate Previews', endpoint: '/admin/generate-all-previews', runLabel: 'Generate All Previews', what: 'AI previews for upcoming fights that do not have one yet.' },
      { label: 'Regenerate All Previews', endpoint: '/admin/generate-all-previews?force=true', runLabel: 'Generate All Previews', what: 'Rewrite every upcoming preview, replacing existing ones. Costs API credits.', danger: true },
    ],
  },
]
