# Disaster-recovery version — baseline

This is an isolated, runnable copy of the browser implementation of the
Social Resource Allocation Task. It is the workspace for the proposed
disaster-recovery framing; the original task remains at the repository root
and must not be changed when developing this version.

At present, this folder deliberately retains the original task text, media,
and behaviour as a baseline. Before deployment, update the task wording,
images, narration, demonstration video, experiment name/version, and ethics
debrief to reflect the approved disaster-recovery design.

For GitHub Pages pre-pilots, this folder uses its own pinned PsychoJS runtime
under `lib/`. On GitHub Pages, results are downloaded as a CSV for the
participant to return using the study's approved procedure.

## Before you upload

1. Replace the ethics-debrief contact placeholders in `experiment.js` with the
   wording approved for your study.
2. Create a separate **PsychoJS** project in Pavlovia, then upload/push the
   entire contents of this folder (including `assets`). The experiment entry
   point is `index.html`; do not upload the parent repository as this project.
3. Run Pavlovia's pilot mode and download a data file to check both the media
   and the column names before recruiting.

The first page has a **Start experiment** button. It is deliberately required
before the experiment starts, so narrated instruction audio is permitted by
modern browser autoplay rules. The narration for each screen starts from the
participant's click to enter that screen; a replay button is available.

## Important implementation notes

- The experiment uses PsychoJS for Pavlovia session handling and data saving,
  with a hand-coded browser interface.
- Trial and pilot-check values are written as normal PsychoJS data rows. The
  pilot checks are stored as a final row with `record_type = pilot_checks`.
- The feedback mechanism, including its threshold structure, is simulated as
  in the desktop version. Do not change this without updating the debrief and
  ethics documentation.
- All media are duplicated under this folder's `assets/` directory so this
  version can be tested and deployed independently of the original task.
