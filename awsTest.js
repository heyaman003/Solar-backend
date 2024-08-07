const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const s3 = new S3Client({ region: 'ap-south-1' });
const cacheDir = path.join(__dirname, 'cache'); // Directory to store cached files

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

async function fetchFileFromS3(bucketName, fileKey) {
    const headParams = {
        Bucket: bucketName,
        Key: fileKey
    };

    try {
        // Get the file's metadata
        const headData = await s3.send(new HeadObjectCommand(headParams));
        const filePath = path.join(cacheDir, fileKey.replace(/\//g, '_')); // Replace '/' with '_' to avoid directory issues

        // Check if the file is already cached
        if (fs.existsSync(filePath)) {
            return filePath; // Return cached file path
        }

        // Download the file from S3 and save it locally
        const getObjectParams = {
            Bucket: bucketName,
            Key: fileKey
        };

        const data = await s3.send(new GetObjectCommand(getObjectParams));
        const writeStream = fs.createWriteStream(filePath);
        data.Body.pipe(writeStream);

        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve(filePath));
            writeStream.on('error', reject);
        });
    } catch (err) {
        console.error(`Error fetching ${fileKey} from S3: `, err);
        throw err;
    }
}

const app = express();

// Enable CORS for all routes
app.use(cors());

app.get('/api/download-file', async (req, res) => {
    const bucketName = 'solarwebsite-documents';
    const fileKey = decodeURIComponent(req.query.file); // Decode URI component
    console.log(`Requested file key: ${fileKey}`);
    if (!fileKey) {
        res.status(400).send('File key is required');
        return;
    }

    try {
        const filePath = await fetchFileFromS3(bucketName, fileKey);

        // Serve the cached file
        res.sendFile(filePath, err => {
            if (err) {
                console.error(`Error sending file: ${err}`);
                res.status(500).send('Failed to send file');
            }
        });
    } catch (err) {
        res.status(500).send('Failed to fetch file');
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
