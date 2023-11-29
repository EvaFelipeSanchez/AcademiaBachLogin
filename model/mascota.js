const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mascota = new Schema({
    userId:  { type: String, required: true }, 
    nombre: {
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

const Mascota = mongoose.model('Mascota', mascota);
module.exports = Mascota;