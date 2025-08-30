const Product = require("../models/product");
const Store = require("../models/store");
const User = require("../models/user");
const Item = require("../models/item");
const Cart = require("../models/cart");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const cache = require("../utils/cache");

//Display all Products on GET
exports.product_list = asyncHandler(async (req, res, next) => {
  const products = await Product.find({});
  res.render("product_list", { products });
});

//READ featured Products on GET
exports.product_featured = asyncHandler(async (req, res, next) => {
  const cacheKey = 'featured_products';
  
  // Try cache first
  let featured_products = cache.get(cacheKey);
  
  if (!featured_products) {
    featured_products = await Product.find({ index_featured: true })
      .populate('store', 'store_name _id')
      .select('name price image store _id')
      .exec();
    
    // Cache for 10 minutes (featured products don't change often)
    cache.set(cacheKey, featured_products, 600);
    console.log('Featured products fetched from database and cached');
  } else {
    console.log('Featured products served from cache');
  }
  
  console.log('Featured products:', featured_products.length);
  
  res.render('all_products', { 
    title: 'Featured Products', 
    products: featured_products,
    page_title: 'Featured Products'
  });
});

//READ new Products on GET
exports.product_new = asyncHandler(async (req, res, next) => {
  const new_products = await Product.find().sort({_id: -1}).populate('store', 'store_name _id').exec();
  
  console.log('New products:', new_products.length);
  
  res.render('all_products', { 
    title: 'New Products', 
    products: new_products,
    page_title: 'New Products'
  });
});

//READ Product detail on GET
exports.product_detail = asyncHandler(async (req, res, next) => {
  try {
    console.log('Product detail requested:', {
      store_id: req.params.store_id,
      product_id: req.params.product_id
    });

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.product_id)) {
      console.log('Invalid product ID format:', req.params.product_id);
      return res.status(400).render('error', { 
        message: 'Invalid product ID format',
        error: { status: 400 }
      });
    }

    // Find the product first
    const product = await Product.findOne({ _id: req.params.product_id }).exec();
    
    if (!product) {
      console.log('Product not found:', req.params.product_id);
      return res.status(404).render('error', { 
        message: 'Product not found',
        error: { status: 404 }
      });
    }

    // Execute queries in parallel for better performance
    const [store, user] = await Promise.all([
      Store.findOne({ _id: product.store }).exec(),
      req.session.user ? User.findById(req.session.user._id).exec() : Promise.resolve(null)
    ]);

    if (!store) {
      console.log('Store not found for product:', product.store);
      return res.status(404).render('error', { 
        message: 'Store not found',
        error: { status: 404 }
      });
    }

    // Check if product is wishlisted
    let wishlisted_products = user ? user.product_wishlist.map(item => item.toString()) : [];
    const is_wishlisted = wishlisted_products.includes(product._id.toString());

    console.log('Product detail data:', {
      product: product.name,
      store: store.store_name,
      user_logged_in: !!user,
      is_wishlisted
    });

    res.render('product_detail', { 
      title: product.name, 
      product: product, 
      store: store, 
      user: user, 
      is_wishlisted: is_wishlisted 
    });

  } catch (error) {
    console.error('Error in product_detail:', error);
    res.status(500).render('error', { 
      message: 'Error loading product details',
      error: { status: 500, stack: error.stack }
    });
  }
});

//READ Product create-form on GET
exports.product_create_get= asyncHandler(async (req, res, next) => {
  res.render("add_product", { title: "Adding product", store_id: req.params.id });
});

//CREATE Product on POST
exports.product_create_post = asyncHandler(async (req, res, next) => {
  const new_product = new Product({
    _id: req.id,
    name: req.body.product_name,
    store: req.params.id,
    price: parseInt(req.body.product_price),
    description: req.body.product_description,
    image: '/images/products/' + req.id.toString() + '.jpeg'
  });
  await new_product.save();

  const products_store = await Store.findById(new_product.store).exec();
  products_store.products.push(new_product);
  await products_store.save();
  
  console.log(products_store.products);

  res.redirect(`/stores/${req.params.id}/`);
});

//READ Product update-form on GET
exports.product_update_get = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Update product form");
});

//UPDATE Product on POST
exports.product_update_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Update product");
});

//DELETE Product on POST
exports.product_delete_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: Delete product");
});


exports.wishlist_post = asyncHandler(async (req, res, next) => {
  if (req.session.user) {
    const user = await User.findOne({ _id: req.session.user._id }).exec();

    if (user.product_wishlist.includes(req.params.product_id)) {
      next();
    }

    const product = await Product.findOne({ _id: req.params.product_id }).exec();
  
    user.product_wishlist.push(product);
  
    await user.save();
  
    product.wishlisted_number = product.wishlisted_number + 1;
  
    await product.save();
  } else {
    res.redirect('/signin');
  }
});
