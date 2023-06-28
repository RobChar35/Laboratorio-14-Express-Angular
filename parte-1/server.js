const express = require('express');
const multer = require('multer');
const app = express();
const upload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se puede subir archivos con el formato pdf.'))
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024
    }
}); // Directorio donde se guardarán los archivos adjuntos

app.post('/upload', upload.array('file'), (req, res) => {
    const fileInfo = req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype
    })); 
    res.send(fileInfo);
});
  

app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
