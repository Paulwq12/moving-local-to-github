const express = require("express");
const multer = require("multer");
const simpleGit = require("simple-git");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3040;

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

  // Ensure token is integrated into the repository URL
  const username = repoUrl.split("/")[3]; // Extract username from repo URL
  const authenticatedRepoUrl = `https://${username}:${token}@${repoUrl.split("https://")[1]}`;

  const localRepoPath = path.join(__dirname, "temp-repo");

  try {
    // Clone the repository
    const git = simpleGit();
    if (fs.existsSync(localRepoPath)) {
      fs.rmSync(localRepoPath, { recursive: true, force: true });
    }
    await git.clone(authenticatedRepoUrl, localRepoPath);

    // Copy uploaded files to the repository
    files.forEach((file) => {
      const destPath = path.join(localRepoPath, file.originalname);
      fs.renameSync(file.path, destPath);
    });

    // Push changes to the repository
    const gitRepo = simpleGit(localRepoPath);
    await gitRepo.addConfig("user.name", "Uploader");
    await gitRepo.addConfig("user.email", "uploader@example.com");
    await gitRepo.add(".");
    await gitRepo.commit("Automated commit via upload page");
    await gitRepo.push("origin", "main");

    // Cleanup
    fs.rmSync(localRepoPath, { recursive: true, force: true });

    res.json({ message: "Files successfully pushed to the repository." });
  } catch (error) {
    console.error(error);

    // Cleanup in case of error
    if (fs.existsSync(localRepoPath)) {
      fs.rmSync(localRepoPath, { recursive: true, force: true });
    }

    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
