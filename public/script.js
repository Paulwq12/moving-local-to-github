document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const repo = document.getElementById('repo').value;
    const token = document.getElementById('token').value;
    const files = document.getElementById('files').files;

    const formData = new FormData();
    formData.append('repo', repo);
    formData.append('token', token);
    
    for (const file of files) {
        formData.append('files', file);
    }

    const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();
    alert(result.message);
});
