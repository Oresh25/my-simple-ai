const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

let uploadedFile = null;

app.use('/files', express.static('uploads'));

const psCommand = `YOUR POWERSHELL CODE HERE`;

function renderPage() {

  let downloadLink = uploadedFile
    ? `<p><a href="/files/${uploadedFile.filename}" download>Download file</a></p>`
    : `<p>No file uploaded yet</p>`;

  return `
<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<title>Server</title>
</head>
<body>

<h2>PowerShell</h2>
<pre>${psCommand}</pre>

<h2>Upload file</h2>

<form action="/upload" method="post" enctype="multipart/form-data">
<input type="file" name="file"/>
<button type="submit">Upload</button>
</form>

${downloadLink}

</body>
</html>
`;
}

app.get('/', (req, res) => {
  res.send(renderPage());
});

app.post('/upload', upload.single('file'), (req, res) => {
  uploadedFile = req.file;
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});