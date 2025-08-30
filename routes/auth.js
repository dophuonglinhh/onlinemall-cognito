const express = require("express");
const router = express.Router();
const { generators } = require("openid-client");
const { syncUserSession } = require("../utils/cognitoUserSync");
const REDIRECT_URI = process.env.COGNITO_REDIRECT_URI;

// Map Cognito claims to your session shape
function mapClaimsToSessionUser(claims) {
  const groups = claims["cognito:groups"] || [];
  const isAdmin = groups.includes("admin");
  const isStoreOwner = groups.includes("store_owner");
  
  // Debug: Log all available claims to understand what's available
  console.log('Available Cognito claims:', Object.keys(claims));
  console.log('Name-related claims:', {
    name: claims.name,
    given_name: claims.given_name,
    family_name: claims.family_name,
    preferred_username: claims.preferred_username,
    nickname: claims.nickname
  });
  
  // Use the name from Cognito, with fallback if name equals email
  

  return {
    id: claims.sub,
    email: claims.email,
    name: claims.name,
    phone_number: claims.phone_number,
    address: claims.address?.formatted || claims.address,
    account_type: isAdmin ? "admin" : (isStoreOwner ? "store owner" : "shopper"),
    groups,
    email_verified: !!claims.email_verified,
    phone_number_verified: !!claims.phone_number_verified,
  };
}

// login route to Amazon Cognito hosted UI
router.get("/signin", async (req, res, next) => {
  try {
    // If user is already authenticated, redirect to home
    if (req.session.user && req.session.user.id) {
      return res.redirect('/');
    }
    
    const oidcClient = await req.app.locals.oidcClientReady;

    const state = generators.state();
    const nonce = generators.nonce();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    // Clear any existing auth session data
    delete req.session.auth;
    
    req.session.auth = { state, nonce, codeVerifier };

    const url = oidcClient.authorizationUrl({
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    
    console.log('Redirecting to Cognito with state:', state);
    res.redirect(url);
  } catch (e) {
    next(e);
  }
});

// callback page after authentication
router.get("/auth/callback", async (req, res, next) => {
  try {
    const oidcClient = await req.app.locals.oidcClientReady;

    const { state, nonce, codeVerifier } = req.session.auth || {};
    
    // Debug logging
    console.log('Callback received:', {
      query: req.query,
      sessionAuth: req.session.auth,
      hasState: !!state,
      hasNonce: !!nonce,
      hasCodeVerifier: !!codeVerifier
    });
    
    if (!state || !nonce || !codeVerifier) {
      console.error('Missing auth session data');
      return res.redirect('/signin?error=session_expired');
    }
    
    const params = oidcClient.callbackParams(req);
    console.log('Callback params:', params);
    
    // Check for error in callback
    if (params.error) {
      console.error('OAuth error:', params.error, params.error_description);
      return res.redirect('/signin?error=' + params.error);
    }
    
    // Check if we already processed this user's session
    if (req.session.user && req.session.user.id) {
      console.log('User already authenticated, redirecting...');
      return res.redirect('/');
    }
    
    const tokenSet = await oidcClient.callback(REDIRECT_URI, params, {
      state,
      nonce,
      code_verifier: codeVerifier,
    });

    const claims = tokenSet.claims(); // ID token claims
    
    // Log claims to debug the name issue
    console.log('Raw Cognito claims:', claims);
    
    const cognitoUser = mapClaimsToSessionUser(claims);
    
    // Sync with MongoDB and create combined session
    req.session.user = await syncUserSession(req, cognitoUser);
    
    // Store tokens if needed for future API calls
    req.session.tokens = {
      idToken: tokenSet.id_token,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    };

    delete req.session.auth;
    
    // Redirect based on profile completion or account type
    if (!req.session.user.profile_completed) {
      res.redirect("/users/" + req.session.user.mongoId + "/update?first_time=true");
    } else if (req.session.user.account_type === "store owner") {
      res.redirect("/account/business");
    } else {
      res.redirect("/");
    }
  } catch (err) {
    console.error('Callback error:', err);
    
    // Handle specific errors
    if (err.message === 'invalid_grant') {
      console.error('Invalid grant - code may have expired or been reused');
      res.redirect('/signin?error=invalid_grant');
    } else {
      next(err);
    }
  }
});

// Logout
router.get("/logout", (req, res) => {
  const logoutUrl = `${process.env.COGNITO_DOMAIN}/logout?client_id=${
    process.env.COGNITO_CLIENT_ID
  }&logout_uri=${encodeURIComponent(process.env.COGNITO_LOGOUT_REDIRECT)}`;
  req.session.destroy(() => res.redirect(logoutUrl));
});

module.exports = router;
