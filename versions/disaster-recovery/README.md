# Storm-recovery version

This is an isolated, runnable version of the Social Resource Allocation Task.
It uses a fictional severe-storm recovery setting; the original task remains at
the repository root.

Participants allocate a fixed recovery budget between a personal payment and
either a recovery service or a resident affected by the storm. They are told
that each resident is connected to one recovery service, and that connected
residents and services tend to judge fairness similarly. The two specific
resident--service connections are deliberately not shown: participants infer
them from the feedback they receive.

All recipients, feedback, and accountability consequences are simulated. The
task includes an explicit debrief explaining this. Introduction screens 1--10
and 12 present on-screen text with matching narration in `assets/audio/`; the
screen-11 example remains on screen only until its demonstration video is
added.

For GitHub Pages pre-pilots, this folder uses its own pinned PsychoJS runtime
under `lib/`. Results are downloaded as a CSV for the participant to return
using the study's approved procedure.

## Before recruitment

1. Replace the ethics-debrief contact placeholders in `experiment.js` with
   wording approved for the study.
2. Test the complete task and download a CSV to check the data columns.
3. Upload the contents of this folder, including `assets/` and `lib/`, to the
   separate repository or hosting location for this version. The entry point is
   `index.html`.

## Implementation notes

- The experiment uses PsychoJS for session handling and data saving, with a
  hand-coded browser interface.
- Trial and pilot-check values are written as normal PsychoJS data rows. Pilot
  checks are stored in a final row with `record_type = pilot_checks`.
- Intermittent emotion probes use separate 0--100 current-state ratings for
  shame and guilt. Trial rows record these as `shame_rating` and
  `guilt_rating`, with `emotion_probe_presented` indicating whether a rating
  was collected on that trial.
- The feedback mechanism, including the hidden resident--service pairing and
  threshold structure, is simulated. Do not change it without also updating
  the debrief and ethics documentation.
- All required media are contained in this folder's `assets/` directory so the
  version can be tested and deployed independently.
