# 🏦 Banking System Backend

A secure and scalable **Banking System Backend** built using **Node.js, Express, and MongoDB**. This project handles user accounts, system accounts, transactions, and ledger entries with proper validation and idempotency.

---

## 🚀 Features

* User Registration & Authentication
* System Account (Bank Account)
* Account Management (status, currency, balance)
* Secure Transactions (User ↔ User, System ↔ User)
* Idempotent Transactions (no duplicate transfers)
* Ledger for audit & tracking
* Email Notifications (Registration / Transaction)
* Proper Error Handling & Validation

---

## 🛠 Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose
* **Authentication:** JWT
* **Email Service:** Nodemailer (Gmail SMTP)
* **Utilities:** dotenv, bcrypt, compression

---

## 📁 Project Structure

```
backend/
│── src/
│   ├── controllers/
│   ├── models/
│   │   ├── user.model.js
│   │   ├── account.model.js
│   │   ├── transaction.model.js
│   │   └── ledger.model.js
│   ├── routes/
│   ├── middlewares/
│   ├── utils/
│   └── server.js
│── .env
│── package.json
│── README.md
```

---

## 🧩 Database Models

### 👤 User Model

* fullName
* email (unique)
* password (hashed)
* role (USER / ADMIN)
* timestamps

### 💳 Account Model

* userId (ref: User)
* balance
* currency (INR, USD, etc.)
* status (ACTIVE / BLOCKED)
* timestamps

### 💸 Transaction Model

* fromAccount
* toAccount
* amount
* status (PENDING / SUCCESS / FAILED)
* idempotencyKey (unique)
* timestamps

### 📒 Ledger Model

* transactionId
* debitAccount
* creditAccount
* amount
* balanceAfterTransaction
* timestamps

---

## 🔐 Environment Variables (.env)

```
PORT=your_port
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 📬 API Overview

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`

### Account

* `POST /api/accounts/create`
* `GET /api/accounts/:id`

### Transaction

* `POST /api/transactions/transfer`

---

## 🛡 Security Notes

* Passwords are hashed using bcrypt
* JWT used for authentication
* Idempotency key prevents duplicate transactions
* System account is protected from public access

---

## 📈 Future Improvements

* Transaction rollback mechanism
* Admin dashboard
* Rate limiting
* Two-factor authentication

---

## 👨‍💻 Author

**Javed**
Backend Student

---

## 📄 License

This project is licensed under the MIT License.
