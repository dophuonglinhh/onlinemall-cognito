const User = require("../models/user");

function requireAuth(req, res, next) {
  // Check if user is authenticated (either through session with mongoId or Cognito ID)
  if (!req.session?.user?.mongoId && !req.session?.user?.id) {
    return res.redirect("/signin"); 
  }
  next();
}

// Enhanced authentication check specifically for Cognito users
function requireCognitoAuth(req, res, next) {
  if (!req.session?.user?.id || !req.session?.user?.mongoId) {
    return res.redirect("/signin");
  }
  next();
}

// Loads the full Mongo user document into req.userDoc (if needed by controllers)
async function loadUserProfile(req, res, next) {
  try {
    if (!req.session?.user?.mongoId) return next();
    const user = await User.findById(req.session.user.mongoId);
    if (!user) return res.redirect("/signin");
    req.userDoc = user;
    next();
  } catch (e) {
    next(e);
  }
}

// Enhanced middleware to ensure profile is complete for certain routes
function requireCompleteProfile(req, res, next) {
  if (!req.session?.user?.profile_completed && req.query.first_time !== 'true') {
    return res.redirect("/users/" + req.session.user.mongoId + "/update?first_time=true");
  }
  next();
}

// Simple group/role guard for Cognito groups
function requireGroup(group) {
  return (req, res, next) => {
    const groups = req.session?.user?.groups || [];
    if (!groups.includes(group)) return res.status(403).send("Forbidden");
    next();
  };
}

// Role-based authentication
function requireRole(role) {
  return (req, res, next) => {
    const userRole = req.session?.user?.account_type;
    if (userRole !== role) return res.status(403).send("Forbidden");
    next();
  };
}

// Admin authentication
function requireAdmin(req, res, next) {
  const userRole = req.session?.user?.account_type;
  if (userRole !== "admin") return res.status(403).send("Forbidden");
  next();
}

module.exports = { 
  requireAuth, 
  requireCognitoAuth,
  loadUserProfile, 
  requireGroup, 
  requireRole,
  requireAdmin,
  requireCompleteProfile
};