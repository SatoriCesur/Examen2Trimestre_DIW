var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

/* GET home page */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Monumentos de Málaga' });
});

/* GET API monumentos que devuelve el GeoJSON */
router.get('/api/monumentos', function(req, res, next) {
  var filePath = path.join(__dirname, '..', 'monumentos.geojson');
  fs.readFile(filePath, 'utf8', function(err, data) {
    if (err) {
      return res.status(500).json({ error: 'No se pudo leer el archivo GeoJSON' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      res.status(500).json({ error: 'El archivo GeoJSON no es válido' });
    }
  });
});

/* POST login */
router.post('/login', function(req, res, next) {
  var usuario = req.body.usuario;
  var password = req.body.password;
  if (usuario === 'admin' && password === '1234') {
    res.json({ success: true, usuario: 'admin' });
  } else {
    res.status(401).json({ success: false, mensaje: 'Usuario o contraseña incorrectos' });
  }
});

module.exports = router;
