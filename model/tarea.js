const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const task = new Schema({
userId:  { type: String, required: true }, 
nombre: { type: String, required: true },
fechaVencimiento: { type: Date },
puntos: { type: Number },
tipotarea: { type: String },

});

const Tarea = mongoose.model('Tarea', task);
module.exports = Tarea;