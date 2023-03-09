const resetForm = document.getElementById("resetPasswordForm");

resetForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = new FormData(resetForm);
  const pwd = formData.get("password");
  const cnfpwd = formData.get("confirmPassword");
  const sendRequest = await fetch("/resetPassword", {
    method: "POST",
    body: JSON.stringify({
      token: TOKEN,
      password: pwd,
      confirmPassword: cnfpwd,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const response = await sendRequest.json();
  console.log(response);
  if (response.status === "true") {
    console.log("Success");
  }
});
