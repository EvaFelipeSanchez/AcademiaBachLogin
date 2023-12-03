const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const barraAvance= new Schema({
    userId:  { type: String, required: true }, 
    barraAvance: {
        type: String, 
        required: true
    },
});

const BarraAvance = mongoose.model('BarraAvance', barraAvance);
module.exports = BarraAvance;