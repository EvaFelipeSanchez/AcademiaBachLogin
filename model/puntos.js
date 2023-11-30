const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const task = new Schema({
    userId:  { type: String, required: true },
    puntosTotales: { type: Number,  required: true  },

});

const Puntos = mongoose.model('Puntos', task);
module.exports = Puntos;