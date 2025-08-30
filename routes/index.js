const express = require('express');
const router = express.Router();

const index_controller = require('../controllers/indexPageController');
const user_controller = require('../controllers/userController');
const store_controller = require("../controllers/storeController");
const product_controller = require('../controllers/productController');

router.get("/browse_name", store_controller.store_list_alphabet);
router.get("/browse_category", store_controller.store_list_category);
router.get("/products/featured", product_controller.product_featured);
router.get("/products/new", product_controller.product_new);



// API endpoint to get current cart count
router.get("/api/cart/count", async (req, res) => {
  if (!req.session.user) {
    return res.json({ count: 0 });
  }
  
  try {
    const Cart = require('../models/cart');
    const cart = await Cart.findOne({ user: req.session.user._id })
      .select('items')
      .populate({
        path: 'items',
        select: 'quantity'
      })
      .lean()
      .exec();
    
    let cartItemCount = 0;
    if (cart && cart.items) {
      cartItemCount = cart.items.reduce((total, item) => {
        return total + (item.quantity || 0);
      }, 0);
    }
    
    res.json({ count: cartItemCount });
  } catch (error) {
    console.error('Error fetching cart count:', error);
    res.json({ count: 0 });
  }
});

router.get('/', user_controller.user_brief, index_controller.display_index);

router.all('*', user_controller.user_brief)

module.exports = router;
