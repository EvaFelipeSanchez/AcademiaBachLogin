const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const muerto = new Schema({
    userId:  { type: String, required: true }, 
    nombre: {
        type: String,
        required: true,
    },
    imagenPrincipal: {
        type: String,
        required: true,
    },
    fecha: { type: Date },

});

const Muerto = mongoose.model('Muerto', muerto);
module.exports = Muerto;