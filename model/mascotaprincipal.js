const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mascotaprincipal = new Schema({
    userId:  { type: String, required: true }, 
    nombrePrincipal: {
        type: String,
        required: true,
    },
    imagenPrincipal: {
        type: String,
        required: true,
    },
    segundaImagen: {
        type: String,
        required: true,
    },
});

const MascotaPrincipal = mongoose.model('MascotaPrincipal', mascotaprincipal);
module.exports = MascotaPrincipal;