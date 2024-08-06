const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const express = require('express');
const cors = require('cors');

const s3 = new S3Client({ region: 'ap-south-1' });

async function fetchFileFromS3(bucketName, fileKey, res) {
    const headParams = {
        Bucket: bucketName,
        Key: fileKey
    };

    try {
        // Log the file key to debug issues
        console.log(`Fetching file from S3: ${fileKey}`);

        // Get the file's metadata first to set the appropriate headers
        const headData = await s3.send(new HeadObjectCommand(headParams));
        res.setHeader('Content-Disposition', `attachment; filename="${fileKey.split('/').pop()}"`);
        res.setHeader('Content-Length', headData.ContentLength);
        res.setHeader('Content-Type', headData.ContentType || 'application/octet-stream');

        // Stream the file from S3 to the response
        const getObjectParams = {
            Bucket: bucketName,
            Key: fileKey
        };

        const data = await s3.send(new GetObjectCommand(getObjectParams));
        data.Body.pipe(res);
    } catch (err) {
        console.error(`Error fetching ${fileKey} from S3: `, err);
        res.status(500).send('Failed to fetch file from S3');
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

    await fetchFileFromS3(bucketName, fileKey, res);
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
