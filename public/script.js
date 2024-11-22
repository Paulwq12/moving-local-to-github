document.getElementById("uploadForm").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const formData = new FormData();
    const folderInput = document.getElementById("folder");
    const repoUrl = document.getElementById("repoUrl").value;
    const token = document.getElementById("token").value;
  
    for (const file of folderInput.files) {
      formData.append("files", file, file.webkitRelativePath);
    }
  
    formData.append("repoUrl", repoUrl);
    formData.append("token", token);
  
    const statusDiv = document.getElementById("status");
    statusDiv.textContent = "Uploading and pushing to GitHub...";
  
    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });
  
      const result = await response.json();
  
      if (response.ok) {
        statusDiv.textContent = `Success: ${result.message}`;
      } else {
        statusDiv.textContent = `Error: ${result.error}`;
      }
    } catch (err) {
      statusDiv.textContent = `Error: ${err.message}`;
    }
  });
  