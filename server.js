const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs/promises");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static("public"));
app.use(express.json());

app.post("/upload", upload.any(), async (req, res) => {
    const { token, repository } = req.body;

    if (!token || !repository) {
        return res.status(400).json({ error: "Missing GitHub token or repository." });
    }

    try {
        for (const file of req.files) {
            const filePath = file.originalname;
            const content = file.buffer.toString("base64");

            const response = await fetch(
                `https://api.github.com/repos/${repository}/contents/${filePath}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `token ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: `Add ${filePath}`,
                        content,
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                return res.status(400).json({ error: error.message });
            }
        }

        res.json({ message: "Files uploaded successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
