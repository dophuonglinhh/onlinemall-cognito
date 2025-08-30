# Exclusive Online Mall (Amazon Cognito Edition)

Cloud Architecting: TASK E Website utilizing Amazon Cognito.

This project reuses a fullstack web app from the course Web Programming and replaces authentication/authorization with Amazon Cognito. It demonstrates three access levels (public, user, admin), self-service registration with email verification, password reset, and MFA.

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- AWS account with permissions to create Cognito resources

## Installation and run

1. Clone the repository:

```
git clone https://github.com/dophuonglinhh/onlinemall-cognito.git
cd onlinemall-cognito
```
2. Create a `.env` file in the project root. (Please find the content of the `.env` in the report - Task E)

3. Install dependencies and run:
```
npm install
npm run dev   
```

4. App runs at http://localhost:3000

## Access levels in the app

- Public: browsing and searching products, stores, fees, etc.
- Regular user: everything public, plus user-only actions (e.g., add to favorite, cart/checkout, account pages).
- Admin (Cognito group `admin`): all user capabilities plus admin features (e.g., manage fees).

## Auth flows supported

- Register new account (self-sign-up)
- Email verification
- Sign-in with MFA from an authenticator app
- Forgot password and reset
- Sign-out via Hosted UI logout endpoint

## Login Information

To access the full features of the website, you can login using the following credentials:

Admin:
- Email: admin@gmail.com
- Password: Admin123!

Shopper (regular):
- Email: test@gmail.com
- Password: Test123!

## Tech stack

- `Node.js`, `Express`, `Pug`, `MongoDB/Mongoose`
- `Amazon Cognito` (User Pool, Hosted UI, OAuth2/OIDC)

## Author

* [**Do Phuong Linh**](https://github.com/dophuonglinhh) (S3926823)
