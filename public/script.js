document.getElementById("uploadForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const repoUrl = document.getElementById("repoUrl").value;
  const token = document.getElementById("token").value;
  const files = document.getElementById("files").files;

  if (!repoUrl || !token || files.length === 0) {
    alert("Please fill all fields and select files or folders.");
    return;
  }

  const formData = new FormData();
  formData.append("repoUrl", repoUrl);
  formData.append("token", token);

  // Append each file/folder to FormData
  for (const file of files) {
    formData.append("files", file);
  }

  try {
    // Send the files to the server
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      document.getElementById("message").textContent = result.message;
      document.getElementById("message").style.color = "#28a745"; // Green
    } else {
      throw new Error(result.error || "An error occurred.");
    }
  } catch (error) {
    document.getElementById("message").textContent = error.message;
    document.getElementById("message").style.color = "#dc3545"; // Red
  }
});
