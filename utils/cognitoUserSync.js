const User = require("../models/user");
const Cart = require("../models/cart");
const mongoose = require("mongoose");

/**
 * Finds or creates a MongoDB user record for a Cognito user
 * @param {Object} cognitoUser - The Cognito user data from session
 * @returns {Object} MongoDB user document
 */
async function findOrCreateUser(cognitoUser) {
  try {
    // First, try to find existing user by cognito_sub
    let user = await User.findOne({ cognito_sub: cognitoUser.id });
    
    if (user) {
      // Update user with latest Cognito data
      user.name = cognitoUser.name;
      user.mail = cognitoUser.email;
      user.phone = cognitoUser.phone_number?.replace('+1', ''); // Remove country code if US number
      user.address = cognitoUser.address;
      user.email_verified = cognitoUser.email_verified;
      user.account_type = cognitoUser.account_type;
      
      await user.save();
      return user;
    }
    
    // If not found by cognito_sub, try to find by email (for migration)
    user = await User.findOne({ mail: cognitoUser.email });
    
    if (user) {
      // Link existing user to Cognito and remove password field
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            cognito_sub: cognitoUser.id,
            email_verified: cognitoUser.email_verified,
            account_type: cognitoUser.account_type
          },
          $unset: {
            password: 1 // Remove password field for Cognito users
          }
        }
      );
      
      // Reload the user to get updated data
      user = await User.findById(user._id);
      
      // Ensure user has a cart
      if (!user.cart) {
        const newCart = new Cart({
          _id: new mongoose.Types.ObjectId(),
          user: user._id,
          items: []
        });
        await newCart.save();
        
        user.cart = newCart._id;
        await user.save();
      }
      
      return user;
    }
    
    // Create new user with all Cognito data (no password field for Cognito users)
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      cognito_sub: cognitoUser.id,
      name: cognitoUser.name,
      mail: cognitoUser.email,
      phone: cognitoUser.phone_number?.replace('+1', ''), // Remove country code if US number
      address: cognitoUser.address,
      email_verified: cognitoUser.email_verified,
      account_type: cognitoUser.account_type,
      profile_completed: true, // Mark as completed since we have all data from Cognito
      profile_image: '/images/users/default-avatar-1.jpeg'
      // Note: No password field for Cognito users
    });
    
    await newUser.save();
    
    // Create cart for new user
    const newCart = new Cart({
      _id: new mongoose.Types.ObjectId(),
      user: newUser._id,
      items: []
    });
    
    await newCart.save();
    
    // Update user with cart reference
    newUser.cart = newCart._id;
    await newUser.save();
    
    return newUser;
    
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw error;
  }
}

/**
 * Updates session with both Cognito and MongoDB user data
 * @param {Object} req - Express request object
 * @param {Object} cognitoUser - Cognito user data
 * @returns {Object} Combined session user object
 */
async function syncUserSession(req, cognitoUser) {
  try {
    const mongoUser = await findOrCreateUser(cognitoUser);
    
    // Create combined session object
    const sessionUser = {
      // Cognito data
      id: cognitoUser.id,
      email: cognitoUser.email,
      name: cognitoUser.name,
      phone_number: cognitoUser.phone_number,
      address: cognitoUser.address,
      account_type: cognitoUser.account_type,
      groups: cognitoUser.groups,
      email_verified: cognitoUser.email_verified,
      phone_number_verified: cognitoUser.phone_number_verified,
      
      // MongoDB data
      mongoId: mongoUser._id,
      _id: mongoUser._id, // For backward compatibility
      mail: mongoUser.mail,
      phone: mongoUser.phone,
      country: mongoUser.country,
      city: mongoUser.city,
      address: mongoUser.address,
      zip: mongoUser.zip,
      profile_image: mongoUser.profile_image,
      profile_completed: mongoUser.profile_completed,
      store_wishlist: mongoUser.store_wishlist,
      product_wishlist: mongoUser.product_wishlist,
      cart: mongoUser.cart
    };
    
    return sessionUser;
    
  } catch (error) {
    console.error('Error in syncUserSession:', error);
    throw error;
  }
}

/**
 * Checks if user profile is complete
 * @param {Object} user - User document
 * @returns {Boolean} Whether profile is complete
 */
function isProfileComplete(user) {
  const requiredFields = ['phone', 'country', 'city', 'address', 'zip'];
  return requiredFields.every(field => user[field] && user[field].trim() !== '');
}

/**
 * Updates user profile completion status
 * @param {String} userId - MongoDB user ID
 */
async function updateProfileCompletion(userId) {
  try {
    const user = await User.findById(userId);
    if (user) {
      user.profile_completed = isProfileComplete(user);
      await user.save();
    }
  } catch (error) {
    console.error('Error updating profile completion:', error);
  }
}

module.exports = {
  findOrCreateUser,
  syncUserSession,
  isProfileComplete,
  updateProfileCompletion
};