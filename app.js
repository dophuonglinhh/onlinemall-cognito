const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const serveStatic = require("serve-static");
const compression = require("compression");
require("dotenv").config();

const indexRouter = require("./routes/index");
const userRouter = require("./routes/user");
const contactRouter = require("./routes/contact");
const feesRouter = require("./routes/fees");
const faqRouter = require("./routes/faq");
const aboutRouter = require("./routes/about");
const copyrightRouter = require("./routes/copyright");
const termsRouter = require("./routes/terms");
const policyRouter = require("./routes/policy");
const storeRouter = require("./routes/store");
const authRouter = require("./routes/auth");

const app = express();

// Initialize OpenID Client
const { Issuer } = require("openid-client");
const OIDC_ISSUER = `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;
const REDIRECT_URI = process.env.COGNITO_REDIRECT_URI;
const HOSTED_DOMAIN = process.env.COGNITO_DOMAIN.replace(/\/+$/, '');

app.locals.oidcClientReady = (async () => {
  const issuer = await Issuer.discover(OIDC_ISSUER);
  // const issuer = new Issuer({
  //   issuer: OIDC_ISSUER,
  //   authorization_endpoint: `${HOSTED_DOMAIN}/oauth2/authorize`,
  //   token_endpoint:        `${HOSTED_DOMAIN}/oauth2/token`,
  //   userinfo_endpoint:     `${HOSTED_DOMAIN}/oauth2/userInfo`,
  //   jwks_uri:              `${OIDC_ISSUER}/.well-known/jwks.json`,
  // });

  return new issuer.Client({
    client_id: process.env.COGNITO_CLIENT_ID,
    client_secret: process.env.COGNITO_CLIENT_SECRET,
    redirect_uris: [REDIRECT_URI],
    response_types: ["code"],
    // token_endpoint_auth_method: "client_secret_basic",
  });
})().catch(console.error);

// Establish connection to database for data CRUD
mongoose.set("strictQuery", false);

// MongoDB connection configuration with proper options
const mongoDB = process.env.MONGODB_URI;
if (!mongoDB) {
  console.error(
    "Missing MONGODB_URI in environment. Please set it in your .env file."
  );
  process.exit(1);
}

const connectionOptions = {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  retryWrites: true,
  writeConcern: {
    w: "majority",
  },
};

main().catch((err) => {
  console.error("[server] MongoDB connection error:", err);
  process.exit(1);
});

async function main() {
  try {
    console.log("[server] Attempting to connect to MongoDB...");
    await mongoose.connect(mongoDB, connectionOptions);
    console.log("[server] Successfully connected to MongoDB Atlas");
  } catch (error) {
    console.error("[server] Failed to connect to MongoDB:", error);
    throw error;
  }
}

// Establish user session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoDB,
      mongoOptions: connectionOptions,
    }),
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Enable compression for all responses
app.use(compression());

app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());

// Optimize static file serving with caching
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "1d", // Cache static files for 1 day
    etag: true,
  })
);

const user_controller = require('./controllers/userController');

app.use((req, res, next) => {
  res.locals.session = req.session || {};
  res.locals.currentUser = req.session?.user || null;
  res.locals.isAuthenticated = !!req.session?.user;
  res.locals.isAdmin = req.session?.user?.account_type === "admin";
  res.locals.isCognitoUser = !!req.session?.user?.id; // Cognito user indicator
  next();
});

// User brief middleware for cart count
app.use(user_controller.user_brief);

app.use("/", indexRouter);
app.use("/", userRouter);
app.use("/contact", contactRouter);
app.use("/fees", feesRouter);
app.use("/faq", faqRouter);
app.use("/about", aboutRouter);
app.use("/copyright", copyrightRouter);
app.use("/terms", termsRouter);
app.use("/policy", policyRouter);
app.use("/", storeRouter);
app.use("/", authRouter);

// Error handler
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;
console.log(`[server] Server running at http://${HOST}:${PORT}`);

module.exports = app;