const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const displayValue= new Schema({
    userId:  { type: String, required: true }, 
    displayValue: {
        type: String, 
        required: true
    },
});

const DisplayValue = mongoose.model('DisplayValue', displayValue);
module.exports = DisplayValue;