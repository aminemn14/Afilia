const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { Readable } = require('stream');
const { createId } = require('@paralleldrive/cuid2');
const mime = require('mime-types');

// Utilisation de multer en mémoire
const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage });

// Initialisation du client S3 pour DigitalOcean Spaces avec forcePathStyle
const client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT.startsWith('http')
    ? process.env.DO_SPACES_ENDPOINT
    : `https://${process.env.DO_SPACES_ENDPOINT}`,
  forcePathStyle: true,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.DO_ACCESS_KEY,
    secretAccessKey: process.env.DO_SECRET_KEY,
  },
});

// Endpoint générique d'upload
// Vous pouvez passer un paramètre de requête "folder" pour définir le dossier de destination
router.post('/upload', uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const folder = req.query.folder || 'uploads';

    // Création d'un stream à partir du buffer du fichier
    const stream = new Readable();
    stream.push(req.file.buffer);
    stream.push(null);

    // Détermination de l'extension du fichier à partir du type MIME
    const extension = mime.extension(req.file.mimetype) || 'bin';
    const fileName = `${folder}/${createId()}.${extension}`;

    const uploadParams = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: fileName,
      Body: stream,
      ContentType: req.file.mimetype,
      ACL: 'public-read',
    };

    const uploadInstance = new Upload({
      client,
      params: uploadParams,
      partSize: 5 * 1024 * 1024,
    });

    const result = await uploadInstance.done();

    res.status(200).json({ url: result.Location });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
