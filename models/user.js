const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  // Cognito identifier - required for Cognito users
  cognito_sub: { 
    type: String, 
    unique: true, 
    sparse: true, // Allow null values but ensure uniqueness when present
    index: true 
  },
  
  name: { 
    type: String, 
    required: [true, 'Name is required'], // Custom error message for missing input
    maxLength: 100, 
    match: [/^[^\d]+$/, 'Name cannot contain numbers']
  },
  mail: { 
    type: String, 
    required: [true, 'Email is required'], // Custom error message for missing input
    maxlength: 200, 
    unique: true, 
    match: [ /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  
  // Password is now optional for Cognito users
  password: {
    type: String, 
    required: function() {
      return !this.cognito_sub; // Only required if not a Cognito user
    },
    maxlength: 100,
    validate: {
      validator: function(value) {
        // Skip validation for Cognito users
        if (this.cognito_sub) {
          return true;
        }
        // For non-Cognito users, require at least 8 characters
        return !value || value.length >= 8;
      },
      message: 'Password must be at least 8 characters long'
    }
  },
  
  // These fields are optional initially and can be filled later
  phone: { 
    type: String, 
    required: false, // Changed to optional for Cognito users
    maxlength: 12
  },
  country: { 
    type: String, 
    required: false, // Changed to optional for Cognito users
    maxlength: 50, 
    match: [/^[^\d]+$/, 'Country cannot contain numbers']
  },
  city: { 
    type: String, 
    required: false, // Changed to optional for Cognito users
    maxlength: 50, 
    match: [/^[^\d]+$/, 'City cannot contain numbers']
  },
  address: { 
    type: String, 
    required: false, // Changed to optional for Cognito users
    maxlength: 300 
  },
  zip: { 
    type: String, 
    required: false, // Changed to optional for Cognito users
    maxlength: 10, 
    match: [ /^[0-9]+$/, 'Zip code must contain only numbers']
  },
  
  account_type: { 
    type: String, 
    required: [true, 'Account type is required'], // Custom error message for missing input
    maxlength: 50,
    enum: ["store owner", "shopper", "admin"], // Added admin type
    default: "shopper"
  },
  
  // Cognito email verification status
  email_verified: { 
    type: Boolean, 
    default: false 
  },
  
  // Profile completion status for Cognito users
  profile_completed: { 
    type: Boolean, 
    default: false 
  },
  
  profile_image: { type: String },
  store_wishlist: [{ type: Schema.Types.ObjectId, ref: "Store" }],
  product_wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  cart: { type: Schema.Types.ObjectId, ref: "Cart"  }
}, {
  timestamps: true // Add createdAt and updatedAt fields
});

// Virtual for user's URL
UserSchema.virtual("url").get(function () {
  return `/${this._id}`;
});

// Export model
module.exports = mongoose.model("User", UserSchema);
