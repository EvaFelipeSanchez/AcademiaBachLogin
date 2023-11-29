const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const papelera = new Schema({
userId:  { type: String, required: true }, 
nombre: { type: String, required: true },
fechaVencimiento: { type: Date },
puntos: { type: Number },
tipotarea: { type: String },
});

const Papelera = mongoose.model('Papelera', papelera);
module.exports = Papelera;