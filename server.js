const express = require("express");
const multer = require("multer");
const simpleGit = require("simple-git");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));

app.post("/upload", upload.array("files"), async (req, res) => {
  const { repoUrl, token } = req.body;
  const files = req.files;

  if (!repoUrl || !token) {
    return res.status(400).json({ error: "Missing repository URL or token." });
  }

  const localRepoPath = path.join(__dirname, "temp-repo");

  try {
    // Clone the repository
    const git = simpleGit();
    if (fs.existsSync(localRepoPath)) {
      fs.rmSync(localRepoPath, { recursive: true, force: true });
    }
    await git.clone(repoUrl, localRepoPath);

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
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
