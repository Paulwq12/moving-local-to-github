document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const files = document.getElementById("files").files;
  const repository = document.getElementById("repository").value;
  const token = document.getElementById("token").value;

  if (!files.length || !repository || !token) {
    alert("Please fill in all fields and select files or folders.");
    return;
  }

  const formData = new FormData();
  formData.append("repository", repository);
  formData.append("token", token);

  for (const file of files) {
    formData.append("files", file, file.webkitRelativePath || file.name);
  }

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (response.ok) {
      document.getElementById("status").innerText = result.message;
    } else {
      document.getElementById("status").innerText = `Error: ${result.error}`;
    }
  } catch (error) {
    document.getElementById("status").innerText = `Error: ${error.message}`;
  }
});
