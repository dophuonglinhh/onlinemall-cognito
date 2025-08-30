const Product = require("../models/product");
const Store = require("../models/store");
const asyncHandler = require("express-async-handler");
const cache = require("../utils/cache");

exports.display_index = asyncHandler(async (req, res, next) => {
  const cacheKey = 'homepage_data';
  
  // Try to get data from cache first
  let cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    console.log('Serving homepage data from cache');
    return res.render("index", {
      title: "Home",
      ...cachedData
    });
  }

  // Execute all database queries in parallel for better performance
  const [new_stores, new_products, featured_stores, featured_products] = await Promise.all([
    Store.find()
      .sort({_id: -1})
      .limit(4)
      .select('store_name store_logo _id')
      .lean()
      .exec(),
    
    Product.find()
      .sort({_id: -1})
      .limit(4)
      .populate('store', 'store_name _id')
      .select('name price image store _id')
      .exec(),
    
    Store.find({ featured: true })
      .select('store_name store_logo _id')
      .lean()
      .exec(),
    
    Product.find({ index_featured: true })
      .populate('store', 'store_name _id')
      .select('name price image store _id')
      .exec()
  ]);

  const data = {
    new_stores,
    new_products,
    featured_stores,
    featured_products
  };

  // Cache the data for 2 minutes (homepage changes frequently)
  cache.set(cacheKey, data, 120);

  console.log('Homepage data fetched from database and cached');

  res.render("index", {
    title: "Home",
    ...data
  });
});

