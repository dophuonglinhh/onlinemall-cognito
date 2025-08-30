const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeeSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['shopper', 'storeOwner'] },
    description: { type: String, required: true },
    amount: { type: String, required: true }
});

module.exports = mongoose.model('Fee', FeeSchema);
