document.addEventListener("DOMContentLoaded",()=>{
const buttons = document.querySelectorAll(".button");
const submitBtn = document.getElementById("submit");
const message = document.getElementById("submit-message");
buttons.forEach(button => {
  button.addEventListener("click", function () {
    buttons.forEach(btn => {
      btn.textContent = "Vote here";
      btn.classList.remove("accepted");
      btn.disabled = false;
    });
    button.textContent = "Accepted";
    button.classList.add("accepted");
  });
});
submitBtn?.addEventListener("click", async function () {
  const acceptedButton = document.querySelector(".button.accepted");

  if (!acceptedButton) {
    message.textContent = "⚠ Please select a party before submitting!";
    message.style.color = "red";
    return;
  }

  const party = acceptedButton.closest(".card").querySelector("h5").textContent;

  try {
    // Send selected party to backend
    const res = await fetch("/vote/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ party }),
    });

    const data = await res.json();

    if (data.success) {
      message.textContent = `✅ Your vote for "${party}" has been submitted!`;
      message.style.color = "green";
      submitBtn.disabled = true;
      buttons.forEach(btn => (btn.disabled = true));
    } else {
      message.textContent = `⚠ ${data.message}`;
      message.style.color = "red";
    }
  } catch (err) {
    message.textContent = "⚠ An error occurred. Try again!";
    message.style.color = "red";
  }
});
});
