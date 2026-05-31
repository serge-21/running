const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbze1PHZpxIkBySlu2ORikIGzMjnnkCBSVRxcIYl7R9qAFLWMMnQq2ImuL1VyUmhufPW/exec";
const ATTENDEE_REFRESH_COOLDOWN_MS = 5000;
const RSVP_SUBMIT_COOLDOWN_MS = 60000;

const runDetails = {
  when: "Friday after work",
  where: "62BG",
  message: "who is gonna carry the boats and the logs? let's go on a run"
};

const replies = {
  yes: "Yes, I'm in for the run.",
  no: "I can't make the run this time."
};

document.getElementById("run-when").textContent = runDetails.when;
document.getElementById("run-where").textContent = runDetails.where;
document.getElementById("invite-copy").textContent = runDetails.message;

const status = document.getElementById("status");
const nameInput = document.getElementById("guest-name");
const attendeeList = document.getElementById("attendee-list");
const noButton = document.querySelector("[data-reply='no']");
let noPosition = null;
let attendeeLoadInFlight = false;
let lastAttendeeLoadAt = 0;
let rsvpSubmitInFlight = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function moveNoButton(clientX, clientY, jump = 120, jitter = 70) {
  let rect = noButton.getBoundingClientRect();
  const margin = 12;

  if (!noPosition) {
    noPosition = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
    noButton.style.setProperty("--runaway-left", `${noPosition.x}px`);
    noButton.style.setProperty("--runaway-top", `${noPosition.y}px`);
    noButton.style.setProperty("--runaway-width", `${noPosition.width}px`);
    noButton.classList.add("is-running");
    rect = noButton.getBoundingClientRect();
  }

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  let awayX = centerX - clientX;
  let awayY = centerY - clientY;
  const distance = Math.hypot(awayX, awayY) || 1;

  awayX /= distance;
  awayY /= distance;

  if (distance < 1) {
    awayX = Math.random() > 0.5 ? 1 : -1;
    awayY = Math.random() > 0.5 ? 1 : -1;
  }

  const jitterX = (Math.random() - 0.5) * jitter;
  const jitterY = (Math.random() - 0.5) * jitter;
  const maxX = window.innerWidth - margin - noPosition.width;
  const maxY = window.innerHeight - margin - noPosition.height;

  noPosition = {
    ...noPosition,
    x: clamp(noPosition.x + awayX * jump + jitterX, margin, maxX),
    y: clamp(noPosition.y + awayY * jump + jitterY, margin, maxY)
  };

  noButton.style.setProperty("--runaway-left", `${noPosition.x}px`);
  noButton.style.setProperty("--runaway-top", `${noPosition.y}px`);
  status.textContent = "Nice try.";
}

function moveNoButtonFromCurrentPosition() {
  const rect = noButton.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.max(rect.width, rect.height, 160);

  moveNoButton(
    centerX - Math.cos(angle) * distance,
    centerY - Math.sin(angle) * distance,
    240,
    110
  );
}

window.addEventListener("resize", () => {
  if (!noPosition) {
    return;
  }

  const margin = 12;
  noPosition = {
    ...noPosition,
    x: clamp(noPosition.x, margin, window.innerWidth - margin - noPosition.width),
    y: clamp(noPosition.y, margin, window.innerHeight - margin - noPosition.height)
  };
  noButton.style.setProperty("--runaway-left", `${noPosition.x}px`);
  noButton.style.setProperty("--runaway-top", `${noPosition.y}px`);
});

function isConfigured() {
  return APPS_SCRIPT_URL.startsWith("https://script.google.com/");
}

function renderAttendees(names) {
  attendeeList.replaceChildren();

  if (!names.length) {
    const empty = document.createElement("li");
    empty.className = "attendees__empty";
    empty.textContent = "No one yet.";
    attendeeList.append(empty);
    return;
  }

  names.forEach((name) => {
    const item = document.createElement("li");
    item.textContent = name;
    attendeeList.append(item);
  });
}

async function loadAttendees() {
  if (!isConfigured()) {
    status.textContent = "Add your Google Apps Script URL in script.js to save replies.";
    return;
  }

  const now = Date.now();

  if (attendeeLoadInFlight || now - lastAttendeeLoadAt < ATTENDEE_REFRESH_COOLDOWN_MS) {
    return;
  }

  attendeeLoadInFlight = true;
  lastAttendeeLoadAt = now;

  try {
    const response = await fetch(APPS_SCRIPT_URL);
    const payload = await response.json();
    const names = Array.isArray(payload.names) ? payload.names : [];

    renderAttendees(names);
  } catch (error) {
    attendeeLoadInFlight = false;
    status.textContent = "Could not load attendee list. Check the Apps Script access settings.";
    return;
  }

  attendeeLoadInFlight = false;
}

function getSubmitCooldownKey(name) {
  return `running-rsvp-submit:${name.toLowerCase()}`;
}

async function submitYesReply() {
  const name = nameInput.value.trim();

  if (!name) {
    status.textContent = "Add your name first.";
    nameInput.focus();
    return;
  }

  if (!isConfigured()) {
    status.textContent = "Add your Google Apps Script URL in script.js to save replies.";
    return;
  }

  if (rsvpSubmitInFlight) {
    return;
  }

  const cooldownKey = getSubmitCooldownKey(name);
  const lastSubmitAt = Number(sessionStorage.getItem(cooldownKey) || 0);
  const now = Date.now();

  if (now - lastSubmitAt < RSVP_SUBMIT_COOLDOWN_MS) {
    const secondsLeft = Math.ceil((RSVP_SUBMIT_COOLDOWN_MS - (now - lastSubmitAt)) / 1000);
    status.textContent = `Already saved. Try again in ${secondsLeft}s.`;
    return;
  }

  rsvpSubmitInFlight = true;
  status.textContent = "Saving your reply...";

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      name
    })
  });

    sessionStorage.setItem(cooldownKey, String(now));
    status.textContent = "You're in.";
    lastAttendeeLoadAt = 0;
    loadAttendees();
  } finally {
    rsvpSubmitInFlight = false;
  }
}

document.querySelectorAll("[data-reply]").forEach((button) => {
  button.addEventListener("click", (event) => {
    if (button.dataset.reply === "no") {
      event.preventDefault();
      moveNoButtonFromCurrentPosition();
      return;
    }

    submitYesReply().catch(() => {
      status.textContent = "Could not save your reply. Message Serge directly.";
    });
  });
});

noButton.addEventListener("pointermove", (event) => {
  const rect = noButton.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);

  if (distance < 110) {
    moveNoButton(event.clientX, event.clientY);
  }
});

noButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  moveNoButtonFromCurrentPosition();
});

noButton.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  const rect = noButton.getBoundingClientRect();
  moveNoButton(rect.left + rect.width / 2, rect.top + rect.height / 2);
});

loadAttendees();
window.setInterval(loadAttendees, ATTENDEE_REFRESH_COOLDOWN_MS);
