const runDetails = {
  when: "Saturday morning",
  where: "Local park loop",
  pace: "Conversational",
  message: "I am heading out for a relaxed run and wanted to see who fancies joining."
};

const replies = {
  yes: "I'm in for the run.",
  maybe: "Maybe for the run. Send me the details?",
  no: "I can't make the run this time."
};

document.getElementById("run-when").textContent = runDetails.when;
document.getElementById("run-where").textContent = runDetails.where;
document.getElementById("run-pace").textContent = runDetails.pace;
document.getElementById("invite-copy").textContent = runDetails.message;

const status = document.getElementById("status");

async function reply(choice) {
  const text = `${replies[choice]} ${runDetails.when}, ${runDetails.where}, ${runDetails.pace} pace.`;

  if (navigator.share) {
    await navigator.share({
      title: "Running reply",
      text
    });
    status.textContent = "Reply opened.";
    return;
  }

  await navigator.clipboard.writeText(text);
  status.textContent = "Reply copied. Paste it into your chat with Serge.";
}

document.querySelectorAll("[data-reply]").forEach((button) => {
  button.addEventListener("click", () => {
    reply(button.dataset.reply).catch(() => {
      status.textContent = "Could not open sharing. Message Serge directly.";
    });
  });
});
