const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({

  tareas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tarea' }],
  papeleras: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Papelera' }],
  mascotas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mascota' }],
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;