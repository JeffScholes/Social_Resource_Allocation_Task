/*
 * Hand-coded PsychoJS implementation of the Social Resource Allocation Task.
 * The interface is intentionally browser-native, while PsychoJS manages the
 * Pavlovia session and writes the data rows at the end of each trial.
 */
import { core, util } from './lib/psychojs-2024.1.0.js';

const { PsychoJS } = core;
const { Scheduler } = util;

const EXPERIMENT_NAME = 'Storm_Recovery_Resource_Allocation_Task';
const VERSION = '0.1.0';
const N_TRIALS = 10;
const STARTING_BALANCE = 1000;
const REPAIR_AMOUNT = 300;
// Provisional monitoring parameters. These can be optimised later when the
// final trial count and decision model are set using BOED.
const SALARY_STATUS_CHECK_INTERVAL = 3;
const SALARY_EXPECTED_KEEP_PER_TRIAL = 500;
const SALARY_STATUS_MARGIN = 150;
const PILOT = true;
const INPUT_GUARD_MS = 250;

const GROUPS = [
  { id: 'shelter', name: 'Temporary Shelter Fund', type: 'group', description: 'Provides safe short-term accommodation, bedding, and basic support for residents displaced by the storm.', image: 'assets/images/temporary_shelter_fund.png' },
  { id: 'essentials', name: 'Essential Recovery Fund', type: 'group', description: 'Provides food, hygiene supplies, transport, and essential household items during recovery.', image: 'assets/images/essential_recovery_fund.png' },
];
const INDIVIDUALS = [
  { id: 'morgan', name: 'Morgan Patel', type: 'individual', description: 'Seeking disaster recovery support.', image: 'assets/images/john_smith.png' },
  { id: 'rowan', name: 'Rowan Clarke', type: 'individual', description: 'Seeking disaster recovery support.', image: 'assets/images/julia_hart.png' },
];
const SPLIT_OPTIONS = [
  { id: 1, self_amount: 700, target_amount: 300 },
  { id: 2, self_amount: 600, target_amount: 400 },
  { id: 3, self_amount: 500, target_amount: 500 },
  { id: 4, self_amount: 400, target_amount: 600 },
];
const INTRO_DIAGRAMS = {
  committee: `<div class="instruction-diagram committee-diagram" role="img" aria-label="You are a temporary recovery coordinator who decides how a £1,000 storm-recovery budget is divided.">
    <div class="diagram-card diagram-you">YOU<span>Temporary recovery coordinator</span></div>
    <div class="diagram-arrow">↓</div>
    <div class="diagram-card diagram-budget">£1,000<span>Storm-recovery budget</span></div>
    <div class="diagram-arrow">↓</div>
    <div class="diagram-caption">Decide how it is allocated</div>
  </div>`,
  salary: `<div class="instruction-diagram salary-diagram" role="img" aria-label="Individual rounds divide £1,000 between your personal payment and an affected resident's recovery support. Service rounds divide £1,000 between your personal payment and a recovery service.">
    <div class="salary-row"><span class="diagram-row-label">RESIDENT ROUND</span><div class="salary-split"><div class="diagram-card diagram-budget">£1,000</div><span class="diagram-arrow horizontal">→</span><div class="diagram-card diagram-salary">PERSONAL PAYMENT</div><span class="diagram-plus">+</span><div class="diagram-card diagram-individual">RESIDENT SUPPORT</div></div></div>
    <div class="salary-row"><span class="diagram-row-label">SERVICE ROUND</span><div class="salary-split"><div class="diagram-card diagram-budget">£1,000</div><span class="diagram-arrow horizontal">→</span><div class="diagram-card diagram-salary">PERSONAL PAYMENT</div><span class="diagram-plus">+</span><div class="diagram-card diagram-group">RECOVERY SERVICE</div></div></div>
  </div>`,
  evaluations: `<div class="instruction-diagram evaluations-diagram" role="img" aria-label="Recovery services evaluate decisions against their fair-support standards. Affected residents evaluate whether their needs were treated fairly.">
    <div class="evaluation-path"><div class="diagram-card diagram-group">RECOVERY SERVICES</div><div class="diagram-arrow">↓</div><div class="diagram-card diagram-evaluation">FAIR SUPPORT<span>Did the allocation meet the service's standard?</span></div></div>
    <div class="evaluation-path"><div class="diagram-card diagram-individual">AFFECTED RESIDENTS</div><div class="diagram-arrow">↓</div><div class="diagram-card diagram-evaluation">FAIR TREATMENT<span>Did the allocation meet the resident's needs fairly?</span></div></div>
  </div>`,
  trialFlow: `<div class="instruction-diagram flow-diagram" role="img" aria-label="The trial sequence is choose a split, predict the response, rate confidence, see feedback, and repair only after a negative evaluation.">
    <div class="flow-steps"><div class="flow-step"><span>1</span>Choose split</div><b>→</b><div class="flow-step"><span>2</span>Predict response</div><b>→</b><div class="flow-step"><span>3</span>Confidence</div><b>→</b><div class="flow-step"><span>4</span>Feedback</div><b>→</b><div class="flow-step"><span>5</span>Repair only after negative evaluation</div></div><p class="diagram-note">Occasionally you will rate how you feel.</p>
  </div>`,
  visibility: `<div class="instruction-diagram visibility-diagram" role="img" aria-label="Service decisions are public and update the recovery accountability record. Resident decisions are private.">
    <div class="visibility-path"><div class="diagram-card diagram-group">SERVICE DECISION</div><div class="diagram-arrow">↓</div><div class="diagram-card diagram-record">ACCOUNTABILITY RECORD<div class="mini-record"><span></span></div></div></div>
    <div class="visibility-path"><div class="diagram-card diagram-individual">RESIDENT DECISION</div><div class="diagram-arrow">↓</div><div class="diagram-card diagram-private">PRIVATE<span>Only you and the resident</span></div></div>
  </div>`,
  bonus: `<div class="instruction-diagram bonus-diagram" role="img" aria-label="Your personal payment and accountability record contribute to a potential final payment.">
    <div class="bonus-inputs"><div class="diagram-card diagram-salary">PERSONAL PAYMENT</div><div class="diagram-plus">+</div><div class="diagram-card diagram-record">ACCOUNTABILITY RECORD</div></div><div class="diagram-arrow">↓</div><div class="diagram-card diagram-payment">POTENTIAL FINAL PAYMENT</div>
  </div>`,
  progress: `<div class="instruction-diagram dashboard-diagram" role="img" aria-label="Task header showing your personal payment, payment status, and accountability record.">
    <div class="dashboard-preview"><div class="dashboard-card"><span>Personal payment</span><strong>£3,400</strong></div><div class="dashboard-card"><span>Payment status</span><strong>On track</strong></div><div class="dashboard-card dashboard-record"><span>Accountability record</span><div class="mini-record"><span></span></div></div></div><p class="diagram-note">These indicators will remain visible throughout the task.</p>
  </div>`,
  ready: `<div class="instruction-diagram ready-diagram" role="img" aria-label="You are ready to allocate £1,000, predict a response, and see feedback."><div class="flow-step">Allocate £1,000</div><b>→</b><div class="flow-step">Predict</div><b>→</b><div class="flow-step">See feedback</div></div>`,
};

const app = document.querySelector('#app');
const psychoJS = new PsychoJS({ debug: false });
let expInfo = {};
let participantId = '';
let narration = null;
let inputAllowedAfter = 0;
let psychoJSStarted = false;
let taskStatus = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function nowSeconds() {
  return performance.now() / 1000;
}

function salaryStatusFor(balance, completedTrials) {
  const expectedSalary = STARTING_BALANCE + (completedTrials * SALARY_EXPECTED_KEEP_PER_TRIAL);
  const difference = balance - expectedSalary;
  if (difference < -SALARY_STATUS_MARGIN) {
    return { status: 'Below expected', expectedSalary };
  }
  if (difference > SALARY_STATUS_MARGIN) {
    return { status: 'Secure', expectedSalary };
  }
  return { status: 'On track', expectedSalary };
}

function render(content, extraClass = '') {
  app.innerHTML = `<section class="panel ${extraClass}">${content}</section>`;
}

function taskHeaderHtml() {
  if (!taskStatus) return '';
  const {
    personalFund,
    totalPublicDecisions,
    publicDecisionsReviewed,
    approvedPublicDecisions,
    salaryStatus,
  } = taskStatus;
  const recordDisplay = publicDecisionsReviewed === 0
    ? '<p class="record-empty">No public service decisions reviewed yet</p>'
    : `<div class="record-meter" role="progressbar" aria-label="Recovery accountability record: ${approvedPublicDecisions} approved public service decisions out of ${totalPublicDecisions}" aria-valuemin="0" aria-valuemax="${totalPublicDecisions}" aria-valuenow="${approvedPublicDecisions}"><span class="record-marker" style="left: ${5 + ((approvedPublicDecisions / totalPublicDecisions) * 90)}%"></span></div>`;
  return `<header class="task-header">
    <section class="task-status-card"><span class="task-status-label">Personal payment</span><strong>£${personalFund.toFixed(2)}</strong></section>
    <section class="task-status-card salary-status"><span class="task-status-label">Payment status</span><strong>${escapeHtml(salaryStatus)}</strong></section>
    <section class="task-status-card community-record"><span class="task-status-label">Accountability record</span>${recordDisplay}</section>
  </header>`;
}

function renderTask(content, extraClass = '') {
  render(`${taskHeaderHtml()}${content}`, extraClass);
}

function stopNarration() {
  if (narration) {
    narration.pause();
    narration.currentTime = 0;
    narration = null;
  }
}

function playNarration(path, statusNode = null) {
  stopNarration();
  narration = new Audio(path);
  narration.preload = 'auto';
  narration.addEventListener('ended', () => {
    if (statusNode) statusNode.textContent = 'Narration finished.';
  });
  narration.play().then(() => {
    if (statusNode) statusNode.textContent = 'Narration playing.';
  }).catch(() => {
    if (statusNode) statusNode.textContent = 'Narration is ready. Select “Play narration” if it did not start.';
  });
}

function narrationControls(audioPath) {
  if (!audioPath) return '';
  return `<div class="actions"><button id="replay-audio" class="secondary">Play narration</button></div>
    <p id="audio-status" class="audio-status">Narration starting…</p>`;
}

function attachReplay(audioPath) {
  const replay = document.querySelector('#replay-audio');
  const status = document.querySelector('#audio-status');
  if (!replay || !status) return;
  replay.addEventListener('click', () => playNarration(audioPath, status));
}

function startNarration(audioPath) {
  if (!audioPath) return;
  const status = document.querySelector('#audio-status');
  playNarration(audioPath, status);
  attachReplay(audioPath);
}

function waitForButton(selector) {
  const button = document.querySelector(selector);
  return new Promise((resolve) => {
    button.addEventListener('click', () => {
      const currentTime = performance.now();
      if (currentTime < inputAllowedAfter) return;
      inputAllowedAfter = currentTime + INPUT_GUARD_MS;
      button.disabled = true;
      resolve();
    }, { once: false });
  });
}

function waitForSelection(selector) {
  const buttons = [...document.querySelectorAll(selector)];
  return new Promise((resolve) => {
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const currentTime = performance.now();
        if (currentTime < inputAllowedAfter) return;
        inputAllowedAfter = currentTime + INPUT_GUARD_MS;
        buttons.forEach((candidate) => { candidate.disabled = true; });
        resolve(button.dataset.value);
      });
    });
  });
}

function addDataRow(values) {
  Object.entries(values).forEach(([key, value]) => psychoJS.experiment.addData(key, value));
  psychoJS.experiment.nextEntry();
}

function writeEvent(eventName, values = {}) {
  addDataRow({
    record_type: eventName,
    experiment: EXPERIMENT_NAME,
    version: VERSION,
    participant_id: participantId,
    timestamp: new Date().toISOString(),
    ...values,
  });
}

async function startPsychoJS() {
  psychoJS.openWindow({ fullscr: false, color: new util.Color([0, 0, 0]), units: 'height' });
  psychoJS.schedule(() => Scheduler.Event.FLIP_REPEAT);
  await psychoJS.start({ expName: EXPERIMENT_NAME, expInfo });
  psychoJSStarted = true;
}

function instructionHtml(title, body, diagram = '', audioPath = null) {
  const instructionContent = diagram
    ? `<div class="instruction-layout${body ? '' : ' diagram-only'}">${body ? `<p class="instruction-body">${body}</p>` : ''}${diagram}</div>`
    : `<p class="instruction-body">${body}</p>`;
  return `<h2>${title}</h2>${instructionContent}${narrationControls(audioPath)}
    <div class="actions"><button id="continue" class="primary">Continue</button></div>`;
}

async function showInstruction(title, body, diagram = '', audioPath = null) {
  render(instructionHtml(title, body, diagram, audioPath));
  startNarration(audioPath);
  await waitForButton('#continue');
  stopNarration();
}

async function showProfiles(title, subtitle, targets, theme, audioPath = null) {
  const cards = targets.map((target) => `
    <article class="profile ${theme}">
      <img src="${target.image}" alt="${escapeHtml(target.name)}">
      <h3>${escapeHtml(target.name)}</h3>
      <p>${escapeHtml(target.description)}</p>
    </article>`).join('');
  const subtitleHtml = subtitle ? `<p class="instruction-body">${subtitle}</p>` : '';
  render(`<h2>${title}</h2>${subtitleHtml}
    <div class="profiles">${cards}</div>
    ${narrationControls(audioPath)}
    <div class="actions"><button id="continue" class="primary">Continue</button></div>`);
  startNarration(audioPath);
  await waitForButton('#continue');
  stopNarration();
}

async function showDemo() {
  render(`<h2>Example round</h2>
    <p class="instruction-body">Suppose you allocate £600 to your personal payment and £400 to the Temporary Shelter Fund. You would then predict whether the service considers £400 fair, rate your confidence, and see its feedback.</p>
    <div class="allocation" aria-label="Example allocation: personal payment £600; recovery support £400.">
      <span class="allocation-labels"><span>PERSONAL PAYMENT</span><span>RECOVERY SUPPORT</span></span>
      <span class="allocation-amounts"><span>£600</span><span>£400</span></span>
      <span class="allocation-bar" aria-hidden="true"><span class="allocation-keep" style="width: 60%"></span><span class="allocation-give" style="width: 40%"></span></span>
    </div>
    <p class="instruction-body">If the feedback is negative, you can add £300 to the same recipient, contribute £300 to wider recovery support, or make no change. An added contribution reduces your personal payment by £300.</p>
    <div class="actions"><button id="continue" class="primary">Continue</button></div>`);
  await waitForButton('#continue');
}

function buildTargets() {
  return [...GROUPS, ...INDIVIDUALS];
}

function buildTrials() {
  const targets = buildTargets();
  const design = [];
  const repetitions = Math.floor(N_TRIALS / targets.length);
  const remainder = N_TRIALS % targets.length;
  targets.forEach((target) => {
    for (let index = 0; index < repetitions; index += 1) design.push({ ...target });
  });
  shuffle(targets).slice(0, remainder).forEach((target) => design.push({ ...target }));
  return shuffle(design).map((target, index) => ({
    ...target,
    trial_num: index + 1,
    split_options: shuffle(SPLIT_OPTIONS).map((option) => ({ ...option, generosity: option.target_amount / STARTING_BALANCE })),
  }));
}

function initialiseHiddenTargets() {
  const shelterLenient = Math.random() < 0.5;
  const morganShelter = Math.random() < 0.5;
  return {
    groups: {
      shelter: { threshold: shelterLenient ? 0.3 : 0.7, assignment: shelterLenient ? 'lenient' : 'strict' },
      essentials: { threshold: shelterLenient ? 0.7 : 0.3, assignment: shelterLenient ? 'strict' : 'lenient' },
    },
    individuals: { morgan: morganShelter ? 'shelter' : 'essentials', rowan: morganShelter ? 'essentials' : 'shelter' },
  };
}

function feedbackFor(trial, choice, hidden) {
  const evaluatorGroup = trial.type === 'group' ? trial.id : hidden.individuals[trial.id];
  const approvalCurve = hidden.groups[evaluatorGroup];
  const threshold = approvalCurve.threshold;
  const probability = 1 / (1 + Math.exp(-12 * (choice.generosity - threshold)));
  return {
    evaluator_group: evaluatorGroup,
    strict_lenient_assignment: approvalCurve.assignment,
    threshold,
    approval_probability: probability,
    approved: Math.random() < probability,
  };
}

function targetCard(trial) {
  const theme = trial.type === 'group' ? 'teal' : 'amber';
  return `<aside class="target-card ${theme}"><img class="target-image" src="${trial.image}" alt="${escapeHtml(trial.name)}"><h3>${escapeHtml(trial.name)}</h3><p>${escapeHtml(trial.description)}</p></aside>`;
}

async function chooseAllocation(trial, balance) {
  const choices = trial.split_options.map((option) => {
    const keepPercentage = (option.self_amount / STARTING_BALANCE) * 100;
    const givePercentage = (option.target_amount / STARTING_BALANCE) * 100;
    return `<button class="choice allocation" data-value="${option.id}" aria-label="Personal payment £${option.self_amount}; recovery support £${option.target_amount}">
      <span class="allocation-labels"><span>PERSONAL PAYMENT</span><span>RECOVERY SUPPORT</span></span>
      <span class="allocation-amounts"><span>£${option.self_amount}</span><span>£${option.target_amount}</span></span>
      <span class="allocation-bar" aria-hidden="true"><span class="allocation-keep" style="width: ${keepPercentage}%"></span><span class="allocation-give" style="width: ${givePercentage}%"></span></span>
    </button>`;
  }).join('');
  renderTask(`<div class="trial-grid"><div class="choices">${choices}</div><div class="recipient-panel"><p class="recipient-label">Recovery recipient</p>${targetCard(trial)}</div></div>`);
  const onset = nowSeconds();
  const selectedId = Number(await waitForSelection('.allocation'));
  return { choice: trial.split_options.find((option) => option.id === selectedId), responseTime: nowSeconds() - onset };
}

async function choosePrediction(trial) {
  const question = trial.type === 'group'
    ? `Do the ${trial.name} representatives think your allocation aligned with their standards for fair disaster recovery support?`
    : `Does ${trial.name} think your allocation treated them fairly?`;
  renderTask(`<h2>${question}</h2><div class="prediction-target">${targetCard(trial)}</div><div class="decision-row"><button class="primary prediction" data-value="approve">YES</button><button class="primary prediction" data-value="disapprove">NO</button></div>`);
  const onset = nowSeconds();
  const prediction = await waitForSelection('.prediction');
  return { prediction, responseTime: nowSeconds() - onset };
}

async function chooseConfidence() {
  const options = [1, 2, 3, 4, 5].map((value) => `<button class="rating-option confidence" data-value="${value}">${value}</button>`).join('');
  renderTask(`<h2>How confident are you in your prediction?</h2><p class="muted">1 = not at all confident &nbsp;&nbsp;&nbsp; 5 = very confident</p><div class="scale">${options}</div>`);
  const onset = nowSeconds();
  const confidence = Number(await waitForSelection('.confidence'));
  return { confidence, responseTime: nowSeconds() - onset };
}

async function fetchingEvaluation() {
  renderTask('<p class="fetching">Fetching disaster recovery evaluation...</p>');
  await new Promise((resolve) => window.setTimeout(resolve, 1500));
}

async function showFeedback(trial, feedback) {
  const isGroup = trial.type === 'group';
  const message = isGroup
    ? (feedback.approved ? `The ${trial.name} representatives judged that your allocation met their standards for fair disaster support.` : `The ${trial.name} representatives judged that your allocation did not meet their standards for fair disaster recovery support.`)
    : (feedback.approved ? `${trial.name} judged that your allocation treated their recovery needs fairly.` : `${trial.name} judged that your allocation did not treat their recovery needs fairly.`);
  const visibility = isGroup ? 'This service decision will appear on your recovery accountability record.' : `This resident decision will only be visible to you and ${trial.name}.`;
  renderTask(`<h2 class="feedback ${feedback.approved ? 'good' : 'bad'}">${message}</h2><div class="profiles">${targetCard(trial)}</div><p>${visibility}</p><div class="actions"><button id="continue" class="primary">Continue</button></div>`);
  await waitForButton('#continue');
}

function emotionProbeSchedule(nTrials) {
  const counts = [];
  for (let count = 5; count <= Math.floor(nTrials / 2); count += 5) counts.push(count);
  if (counts.length === 0) return new Set();
  const count = counts.reduce((best, candidate) => Math.abs(nTrials / candidate - 2.5) < Math.abs(nTrials / best - 2.5) ? candidate : best, counts[0]);
  const gaps = shuffle(Array(Math.min(count, nTrials - 2 * count)).fill(3).concat(Array(count - Math.min(count, nTrials - 2 * count)).fill(2)));
  let trialNumber = 0;
  return new Set(gaps.map((gap) => { trialNumber += gap; return trialNumber; }));
}

async function emotionProbe() {
  renderTask(`<h2>Right now, to what extent do you feel each of the following emotions?</h2>
    <div class="question emotion-slider"><label for="shame-rating">Shame</label><input id="shame-rating" type="range" min="0" max="100" value="50" aria-describedby="shame-anchors"><div id="shame-anchors" class="slider-labels muted"><span>Not at all</span><span>Extremely</span></div></div>
    <div class="question emotion-slider"><label for="guilt-rating">Guilt</label><input id="guilt-rating" type="range" min="0" max="100" value="50" aria-describedby="guilt-anchors"><div id="guilt-anchors" class="slider-labels muted"><span>Not at all</span><span>Extremely</span></div></div>
    <div class="actions"><button id="continue" class="primary" disabled>Continue</button></div>`);
  const onset = nowSeconds();
  const touched = { shame: false, guilt: false };
  ['shame', 'guilt'].forEach((emotion) => {
    const slider = document.querySelector(`#${emotion}-rating`);
    slider.addEventListener('input', () => {
      touched[emotion] = true;
      document.querySelector('#continue').disabled = !touched.shame || !touched.guilt;
    });
  });
  await waitForButton('#continue');
  return {
    shameRating: Number(document.querySelector('#shame-rating').value),
    guiltRating: Number(document.querySelector('#guilt-rating').value),
    responseTime: nowSeconds() - onset,
  };
}

async function chooseRepair(trial) {
  const targetRepairLabel = trial.type === 'individual'
    ? `Add £${REPAIR_AMOUNT} to ${escapeHtml(trial.name)}’s recovery support`
    : `Add £${REPAIR_AMOUNT} to the ${escapeHtml(trial.name)}`;
  renderTask(`<h2>Would you like to revise the support?</h2><p>An added £${REPAIR_AMOUNT} contribution reduces your personal payment by £${REPAIR_AMOUNT}.</p><div class="vertical-choices"><button class="primary repair" data-value="target">${targetRepairLabel}</button><button class="primary repair" data-value="community">Contribute £${REPAIR_AMOUNT} to wider recovery support</button><button class="primary repair" data-value="none">Make no change</button></div>`);
  const onset = nowSeconds();
  const repairChoice = await waitForSelection('.repair');
  return { repairChoice, responseTime: nowSeconds() - onset };
}

async function runTrials() {
  const trials = buildTrials();
  const hidden = initialiseHiddenTargets();
  const probeTrials = emotionProbeSchedule(trials.length);
  let balance = STARTING_BALANCE;
  taskStatus = {
    personalFund: balance,
    totalPublicDecisions: trials.filter((trial) => trial.type === 'group').length,
    publicDecisionsReviewed: 0,
    approvedPublicDecisions: 0,
    salaryStatus: 'On track',
    expectedSalary: STARTING_BALANCE,
    salaryStatusUpdated: false,
  };
  for (const trial of trials) {
    const allocation = await chooseAllocation(trial, balance);
    const prediction = await choosePrediction(trial);
    const confidence = await chooseConfidence();
    const feedback = feedbackFor(trial, allocation.choice, hidden);
    balance += allocation.choice.self_amount;
    taskStatus.personalFund = balance;
    await fetchingEvaluation();
    if (trial.type === 'group') {
      taskStatus.publicDecisionsReviewed += 1;
      if (feedback.approved) taskStatus.approvedPublicDecisions += 1;
    }
    await showFeedback(trial, feedback);
    let emotion = null;
    if (probeTrials.has(trial.trial_num)) emotion = await emotionProbe();
    let repair = { repairChoice: '', responseTime: '' };
    if (!feedback.approved) {
      repair = await chooseRepair(trial);
      if (repair.repairChoice !== 'none') {
        balance -= REPAIR_AMOUNT;
        taskStatus.personalFund = balance;
      }
    }
    if (trial.trial_num % SALARY_STATUS_CHECK_INTERVAL === 0 || trial.trial_num === trials.length) {
      const salaryStatus = salaryStatusFor(balance, trial.trial_num);
      taskStatus.salaryStatus = salaryStatus.status;
      taskStatus.expectedSalary = salaryStatus.expectedSalary;
      taskStatus.salaryStatusUpdated = true;
    } else {
      taskStatus.salaryStatusUpdated = false;
    }
    writeEvent('trial', {
      trial_num: trial.trial_num,
      target_type: trial.type,
      target_name: trial.name,
      evaluator_group: feedback.evaluator_group,
      strict_lenient_assignment: feedback.strict_lenient_assignment,
      self_amount: allocation.choice.self_amount,
      target_amount: allocation.choice.target_amount,
      generosity: allocation.choice.generosity,
      current_funds: balance,
      committee_salary_status: taskStatus.salaryStatus,
      committee_expected_salary: taskStatus.expectedSalary,
      salary_status_updated: taskStatus.salaryStatusUpdated,
      allocation_response_time: allocation.responseTime,
      prediction_response_time: prediction.responseTime,
      confidence_response_time: confidence.responseTime,
      emotion_response_time: emotion ? emotion.responseTime : '',
      repair_response_time: repair.responseTime,
      prediction: prediction.prediction,
      confidence: confidence.confidence,
      approved: feedback.approved,
      approval_probability: feedback.approval_probability,
      approval_threshold: feedback.threshold,
      repair_choice: repair.repairChoice,
      emotion_probe_presented: emotion ? 1 : 0,
      shame_rating: emotion ? emotion.shameRating : '',
      guilt_rating: emotion ? emotion.guiltRating : '',
    });
  }
  taskStatus = null;
}

async function pilotChecks() {
  render(`<h2>Final questions</h2><div class="question"><p>How real did the evaluations in this section feel to you?</p><input id="believability" type="range" min="0" max="100" value="50"><div class="slider-labels muted"><span>Not at all real</span><span>Completely real</span></div></div>
    <div class="question"><label for="evaluators">In your own words, who were the evaluators in this task, and what did they base their decisions on?</label><textarea id="evaluators"></textarea></div>
    <div class="question"><label for="visibility">Who could see each type of decision you made?</label><textarea id="visibility"></textarea></div><div class="actions"><button id="continue" class="primary">Continue</button></div>`);
  await waitForButton('#continue');
  const pageOne = { believability: document.querySelector('#believability').value, evaluators: document.querySelector('#evaluators').value, visibility: document.querySelector('#visibility').value };
  render(`<h2>Final questions</h2><div class="question"><label for="importance">Did it matter to you what individuals and group representatives thought of you? If so, why?</label><textarea id="importance"></textarea></div>
    <div class="question"><label for="hypothesis">Do you have any thoughts on what this study was really investigating?</label><textarea id="hypothesis"></textarea></div>
    <div class="question"><label for="suspicion">At any point during the task, did you doubt that the evaluations were genuine? If yes, please explain.</label><textarea id="suspicion"></textarea></div><div class="actions"><button id="continue" class="primary">Continue</button></div>`);
  await waitForButton('#continue');
  writeEvent('pilot_checks', { ...pageOne, importance: document.querySelector('#importance').value, hypothesis: document.querySelector('#hypothesis').value, suspicion: document.querySelector('#suspicion').value });
}

async function ethicalDebrief() {
  await showInstruction('About this study', `The social feedback in this task was simulated and generated by the study’s programmed procedure. No recovery service, resident, or other person judged any of your decisions.\n\nNothing in this task reflects your worth, character, or real behaviour.\n\nThe storm-recovery setting, recipients, and feedback were fictional. This study examines how people respond to perceived social evaluation and to decisions about allocating resources. The statement that your accountability record would be reviewed for a bonus was a motivational framing element.\n\nThank you for taking part. Your contribution is useful for helping researchers understand these processes.`);
  await showInstruction('Your data and study contacts', `You may request withdrawal of your data by [INSERT APPROVED WITHDRAWAL DEADLINE].\n\nTo do so, contact: [INSERT WITHDRAWAL CONTACT EMAIL]\n[INSERT APPROVED WITHDRAWAL PROCEDURE, INCLUDING ANY PARTICIPANT ID OR STUDY REFERENCE.]\n\nResearcher: [INSERT RESEARCHER NAME AND EMAIL]\nSupervisor: [INSERT SUPERVISOR NAME AND EMAIL]\n\nFor concerns or complaints about the study or your participant rights:\n[INSERT ETHICS-COMPLAINTS CONTACT DETAILS]`);
  await showInstruction('Before you leave', `If any part of this task has left you feeling unsettled, take a moment to notice your surroundings and return your attention to your day at your own pace.\n\nYou may wish to speak with someone you trust or use a support service.\n\nUK and Republic of Ireland: Samaritans — call 116 123, free, 24 hours a day. In England, for urgent mental-health support, call NHS 111 and select the mental-health option. In an emergency or if anyone is in immediate danger, call 999 or go to A&E.\n\nThank you again for your time and contribution.`);
}

async function finishExperiment() {
  render('<h2>Thank you</h2><p>Your responses have been recorded. Select Finish to close the task.</p><div class="actions"><button id="finish" class="primary">Finish</button></div>');
  await waitForButton('#finish');
  if (!psychoJSStarted) return;

  // Submit and close the Pavlovia session directly. PsychoJS.quit() also
  // creates jQuery UI dialogs; those are unsuitable for this hand-coded DOM
  // interface and previously obscured the actual completion error.
  render('<h2>Saving your responses…</h2><p>Please keep this page open while your session is submitted.</p>');
  try {
    psychoJS.experiment.experimentEnded = true;
    psychoJS._scheduler.stop();
    if (psychoJS.getEnvironment() === PsychoJS.Environment.SERVER) {
      window.removeEventListener('beforeunload', psychoJS.beforeunloadCallback);
    }
    await psychoJS.experiment.save();
    if (psychoJS.getEnvironment() === PsychoJS.Environment.SERVER) {
      await psychoJS.serverManager.closeSession(true);
    }
    render('<h2>Thank you</h2><p>Your responses have been submitted successfully. You may now close this page.</p>');
  } catch (error) {
    const details = error?.error?.message || error?.message || error?.context || String(error);
    render(`<h2>We could not submit your responses</h2><p class="error">${escapeHtml(details)}</p><p>Please take a screenshot of this message and contact the researcher before closing this page.</p>`);
  }
}

async function runExperiment() {
  await showInstruction('Disaster recovery response', '', INTRO_DIAGRAMS.committee, 'assets/audio/01.wav');
  await showInstruction('Who will receive disaster support?', '', INTRO_DIAGRAMS.salary, 'assets/audio/02.wav');
  await showProfiles('Recovery services', '', GROUPS, 'teal', 'assets/audio/03.wav');
  await showProfiles('Affected residents', '', INDIVIDUALS, 'amber', 'assets/audio/04.wav');
  await showInstruction('How feedback works', '', INTRO_DIAGRAMS.evaluations, 'assets/audio/05.wav');
  await showInstruction('How each round works', '', INTRO_DIAGRAMS.trialFlow, 'assets/audio/06.wav');
  await showInstruction('Public and private decisions', '', INTRO_DIAGRAMS.visibility, 'assets/audio/07.wav');
  await showInstruction('Your potential final payment', '', INTRO_DIAGRAMS.bonus, 'assets/audio/08.wav');
  await showInstruction('Monitoring your progress', '', INTRO_DIAGRAMS.progress, 'assets/audio/09.wav');
  await showInstruction('Example — before you begin', 'You will now see an example of the decision and feedback sequence.', '', 'assets/audio/10.wav');
  await showDemo();
  await showInstruction('Ready to begin', '', INTRO_DIAGRAMS.ready, 'assets/audio/12.wav');
  await runTrials();
  if (PILOT) await pilotChecks();
  await ethicalDebrief();
  await finishExperiment();
}

document.querySelector('#start-experiment').addEventListener('click', async () => {
  const startButton = document.querySelector('#start-experiment');
  startButton.disabled = true;
  participantId = document.querySelector('#participant-id').value.trim() || `anon_${Date.now()}`;
  expInfo = { participant: participantId, session: '001', date: new Date().toISOString(), expName: EXPERIMENT_NAME, version: VERSION };
  try {
    await startPsychoJS();
    await runExperiment();
  } catch (error) {
    render(`<h2>Unable to start the experiment</h2><p class="error">${escapeHtml(error?.message || error)}</p><p>Please reload the page. If this happens on Pavlovia, contact the researcher.</p>`);
  }
});
