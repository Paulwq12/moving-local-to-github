const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to get the SHA of a file
async function getFileSha(repository, filePath, token) {
  const url = `https://api.github.com/repos/${repository}/contents/${filePath}`;
  const response = await fetch(url, {
    headers: { Authorization: `token ${token}` },
  });

  if (response.ok) {
    const data = await response.json();
    return data.sha;
  } else if (response.status === 404) {
    return null;
  } else {
    throw new Error(`Error checking file SHA: ${response.statusText}`);
  }
}

// Upload files to GitHub while preserving folder structure
async function uploadToGitHub(repository, token, files) {
  for (const file of files) {
    const filePath = file.originalname.replace(/\\/g, "/"); // Normalize file paths
    const content = file.buffer.toString("base64");

    try {
      const sha = await getFileSha(repository, filePath, token);

      const body = {
        message: `Add or update ${filePath}`,
        content,
      };
      if (sha) body.sha = sha;

      const response = await fetch(
        `https://api.github.com/repos/${repository}/contents/${filePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to upload ${filePath}: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error uploading ${filePath}: ${error.message}`);
    }
  }
}

app.post("/upload", upload.any(), async (req, res) => {
  const { token, repository } = req.body;

  if (!token || !repository) {
    return res.status(400).json({ error: "Missing GitHub token or repository." });
  }

  try {
    await uploadToGitHub(repository, token, req.files);
    res.json({ message: "Files and folders uploaded successfully, preserving structure." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
