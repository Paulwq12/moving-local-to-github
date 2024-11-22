const express = require("express");
const multer = require("multer");
const simpleGit = require("simple-git");
const fs = require("fs");
const path = require("path");
const fsExtra = require("fs-extra");

const app = express();
const PORT = 3000;

// Ensure "uploads" folder exists
const uploadsFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({ dest: uploadsFolder });

// Middleware for handling JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

app.post("/upload", upload.array("files"), async (req, res) => {
  const { repoUrl, token } = req.body;
  const files = req.files;

  if (!repoUrl || !token) {
    return res.status(400).json({ error: "Missing repository URL or token." });
  }

  const username = repoUrl.split("/")[3];
  const authenticatedRepoUrl = `https://${username}:${token}@${repoUrl.split("https://")[1]}`;
  const localRepoPath = path.join(__dirname, "temp-repo");

  try {
    const git = simpleGit();
    if (fs.existsSync(localRepoPath)) {
      fs.rmSync(localRepoPath, { recursive: true, force: true });
    }
    await git.clone(authenticatedRepoUrl, localRepoPath);

    // Move files and folders to the repository
    for (const file of files) {
      const destPath = path.join(localRepoPath, file.originalname);

      // If the uploaded file is a directory, move it recursively
      if (fs.statSync(file.path).isDirectory()) {
        await moveDirectory(file.path, destPath);
      } else {
        // If it's a file, move it to the destination folder
        fs.renameSync(file.path, destPath);
      }
    }

    const gitRepo = simpleGit(localRepoPath);
    await gitRepo.addConfig("user.name", "Uploader");
    await gitRepo.addConfig("user.email", "uploader@example.com");
    await gitRepo.add(".");
    await gitRepo.commit("Automated commit via upload page");
    await gitRepo.push("origin", "main");

    // Cleanup
    fs.rmSync(localRepoPath, { recursive: true, force: true });

    res.json({ message: "Files and folders successfully pushed to the repository." });
  } catch (error) {
    console.error(error);

    if (fs.existsSync(localRepoPath)) {
      fs.rmSync(localRepoPath, { recursive: true, force: true });
    }

    res.status(500).json({ error: error.message });
  }
});

// Function to move a directory and its contents
async function moveDirectory(sourceDir, destDir) {
  try {
    // Use fs-extra to copy the entire directory structure (including subfolders and files)
    await fsExtra.copy(sourceDir, destDir, { overwrite: true });

    // Remove the original uploaded directory after moving its contents
    await fsExtra.remove(sourceDir);
  } catch (err) {
    console.error("Error moving directory:", err);
  }
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
