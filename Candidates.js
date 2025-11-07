const buttons = document.querySelectorAll(".button");
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
const submitBtn = document.getElementById("submit");
const message = document.getElementById("submit-message");

submitBtn.addEventListener("click", function () {
  const acceptedButton = document.querySelector(".button.accepted");

  if (!acceptedButton) {
    message.textContent = "⚠️ Please select a party before submitting!";
    message.style.color = "red";
    return;
  }
  const party = acceptedButton.closest(".card").querySelector(".card_title").textContent;
  message.textContent = `✅ Your vote for "${party}" has been submitted!`;
  message.style.color = "green";
  submitBtn.disabled = true;
});
