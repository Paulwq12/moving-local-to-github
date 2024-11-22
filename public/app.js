document.getElementById("uploadForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const token = document.getElementById("githubToken").value;
    const repo = document.getElementById("repository").value;
    const files = document.getElementById("fileInput").files;

    if (!files.length) {
        alert("Please select files or folders to upload.");
        return;
    }

    const statusDiv = document.getElementById("status");
    statusDiv.textContent = "Uploading files...";

    const formData = new FormData();
    formData.append("token", token);
    formData.append("repository", repo);

    Array.from(files).forEach((file) => {
        formData.append("files", file, file.webkitRelativePath || file.name);
    });

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData,
        });
        const result = await response.json();
        if (response.ok) {
            statusDiv.textContent = `Upload completed: ${result.message}`;
        } else {
            statusDiv.textContent = `Error: ${result.error}`;
        }
    } catch (error) {
        statusDiv.textContent = `Error: ${error.message}`;
    }
});
