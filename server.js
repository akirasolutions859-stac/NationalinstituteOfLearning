const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const DATA_FILE = path.join(__dirname, 'submissions.json');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// MIME types lookup
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf'
};

// Helper to serve static files
function serveStaticFile(reqPath, res) {
  // Default to index.html if directory
  let filePath = path.join(PUBLIC_DIR, reqPath === '/' ? 'index.html' : reqPath);
  
  // Prevent directory traversal attacks
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

// Helper to read submissions
function readSubmissions(callback) {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Return empty array if file doesn't exist
        callback([]);
      } else {
        console.error('Error reading submissions file:', err);
        callback([]);
      }
    } else {
      try {
        callback(JSON.parse(data || '[]'));
      } catch (e) {
        console.error('Error parsing submissions JSON:', e);
        callback([]);
      }
    }
  });
}

// Helper to write submissions
function writeSubmissions(submissions, callback) {
  fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Error writing submissions file:', err);
      callback(false);
    } else {
      callback(true);
    }
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;
  let pathname = url.pathname;

  // Handle Root Redirect to Custom Path
  if (pathname === '/') {
    res.writeHead(302, { 'Location': '/NationalInstituteOfLearning/' });
    res.end();
    return;
  }

  // Handle /NationalInstituteOfLearning without trailing slash
  if (pathname === '/NationalInstituteOfLearning') {
    res.writeHead(302, { 'Location': '/NationalInstituteOfLearning/' });
    res.end();
    return;
  }

  // Strip prefix /NationalInstituteOfLearning if present
  const prefix = '/NationalInstituteOfLearning';
  if (pathname.startsWith(prefix)) {
    pathname = pathname.substring(prefix.length);
    if (pathname === '') pathname = '/';
  }

  // API: Register Submission
  if (pathname === '/api/register' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        
        // Basic Server Side Validation
        if (!payload.name || !payload.email || !payload.phone || !payload.course) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required fields: name, email, phone, and course are required.' }));
          return;
        }

        readSubmissions((submissions) => {
          let cvUrl = '';
          let cvName = '';
          
          if (payload.cvFile && payload.cvFileName) {
            try {
              const matches = payload.cvFile.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches) {
                const buffer = Buffer.from(matches[2], 'base64');
                const uniqueName = `${Date.now()}_${payload.cvFileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
                fs.writeFileSync(path.join(UPLOADS_DIR, uniqueName), buffer);
                cvUrl = `/uploads/${uniqueName}`;
                cvName = payload.cvFileName;
              }
            } catch (err) {
              console.error('Error saving CV file:', err);
            }
          }

          const newSubmission = {
            id: Date.now().toString(),
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            whatsapp: payload.whatsapp || payload.phone,
            summary: payload.summary || '',
            location: payload.location || '',
            course: payload.course,
            details: payload.details || '',
            cvUrl: cvUrl,
            cvName: cvName,
            submittedAt: new Date().toISOString()
          };

          submissions.push(newSubmission);

          writeSubmissions(submissions, (success) => {
            if (success) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Enrollment successful!', data: newSubmission }));
            } else {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to save submission. Server error.' }));
            }
          });
        });
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
      }
    });
  }
  // API: Get Submissions (Admin)
  else if (pathname === '/api/submissions' && method === 'GET') {
    readSubmissions((submissions) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(submissions));
    });
  }
  // API: Export Submissions to CSV
  else if (pathname === '/api/submissions/export' && method === 'GET') {
    readSubmissions((submissions) => {
      const headers = ['ID', 'Name', 'Email', 'Phone', 'WhatsApp', 'Summary', 'Location', 'Course', 'Details', 'CV URL', 'CV Name', 'Submitted At'];
      const csvRows = [headers.join(',')];
      
      submissions.forEach(sub => {
        const row = [
          sub.id,
          `"${(sub.name || '').replace(/"/g, '""')}"`,
          `"${(sub.email || '').replace(/"/g, '""')}"`,
          `"${(sub.phone || '').replace(/"/g, '""')}"`,
          `"${(sub.whatsapp || '').replace(/"/g, '""')}"`,
          `"${(sub.summary || '').replace(/"/g, '""')}"`,
          `"${(sub.location || '').replace(/"/g, '""')}"`,
          `"${(sub.course || '').replace(/"/g, '""')}"`,
          `"${(sub.details || '').replace(/"/g, '""')}"`,
          `"${(sub.cvUrl || '').replace(/"/g, '""')}"`,
          `"${(sub.cvName || '').replace(/"/g, '""')}"`,
          sub.submittedAt
        ];
        csvRows.push(row.join(','));
      });

      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="niol_enrollments.csv"'
      });
      res.end(csvRows.join('\n'));
    });
  }
  // Fallback to serving static files
  else {
    serveStaticFile(pathname, res);
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/NationalInstituteOfLearning/`);
  console.log(`Admin portal at http://localhost:${PORT}/admin.html`);
});
