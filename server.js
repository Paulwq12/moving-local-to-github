const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const app = express();
const upload = multer({ dest: 'uploads/' });
require('dotenv').config();

app.use(express.json());
app.use(express.static('public'));

app.post('/upload', upload.array('files'), async (req, res) => {
    const { repo, token } = req.body;

    if (!repo || !token || !req.files) {
        return res.status(400).json({ message: 'Repository, token, and files are required.' });
    }

    const [owner, repoName] = repo.split('/');
    const promises = req.files.map(async (file) => {
        const filePath = path.join(__dirname, file.path);
        const content = fs.readFileSync(filePath, { encoding: 'base64' });
        const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${file.originalname}`;

        const response = await axios.put(url, {
            message: `Upload ${file.originalname}`,
            content: content,
        }, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github .v3+json'
            }
        });

        return response.data;
    });

    try {
        await Promise.all(promises);
        res.json({ message: 'Files uploaded successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading files', error: error.message });
    } finally {
        req.files.forEach(file => fs.unlinkSync(path.join(__dirname, file.path))); // Clean up uploaded files
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
