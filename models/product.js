const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: { type: String, required: true },
  store: { type: Schema.Types.ObjectId, ref:"Store", required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  time_sold: { type: Number, default: 0 },
  date_added: { type: Date, default: Date.now },
  index_featured: { type: Boolean },
  store_featured: { type: Boolean },
  wishlisted_number: { type: Number, default: 0 }
});

// Virtual for user's URL
ProductSchema.virtual("url").get(function () {
  const storeId = this.store && this.store._id ? this.store._id : this.store;
  return `/stores/${storeId}/products/${this._id}`;
});

ProductSchema.virtual("store_url").get(function () {
  const storeId = this.store && this.store._id ? this.store._id : this.store;
  return `/stores/${storeId}`;
});


// Export model
module.exports = mongoose.model("Product", ProductSchema);