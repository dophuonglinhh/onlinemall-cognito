const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StoreSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref:"User", required: true },
  business_name: { type: String, required: true, maxlength: 200 },
  store_name: { type: String, required: true, maxlength: 200 },
  store_category: { 
    type: String, 
    required: true, 
    maxlength: 200,
    enum: [
      "Clothing store",
      "Luxury store",
      "Accessory store",
      "Technology store", 
      "Pet store", 
      "Toy store", 
      "Thrift store",
    ] 
  },
  store_logo: { type: String, required: true },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  date_added: { type: Date, default: Date.now },
  featured: { type: Boolean },
  date_added: { type: Date, default: Date.now },
  wishlisted_number: { type: Number, default: 0 }
});

// Virtual for user's URL
StoreSchema.virtual("url").get(function () {
  return `/stores/${this._id}`;
});

// Export model
module.exports = mongoose.model("Store", StoreSchema);