::: {align="center"}
# 🎫 TicketSense

### AI-Powered Service Ticket Categorization & Support Dashboard

**A full-stack proof-of-concept for creating, classifying, prioritizing,
and managing customer support tickets.**

![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/API-Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
:::

------------------------------------------------------------------------

## 📌 Project Overview

TicketSense is a full-stack support-ticket management PoC. Customers can
submit support requests, and the backend assigns a predicted category
and priority using a **rule-based baseline classifier**. Administrators
can review tickets, update status/classification, inspect confidence and
reasoning, and monitor SLA target timers.

> **Current implementation:** Classification is rule-based. Do not
> describe it as a trained machine-learning model unless you replace or
> extend the classification service.

## ✨ Features

-   🔐 Authentication and role-aware customer/admin views
-   📝 Ticket creation using title and description
-   🧠 Automatic category and priority prediction
-   📊 Confidence score and manual-review flag
-   🔎 Search and filters by category, priority, and status
-   🔄 Status workflow: New, In Progress, Resolved
-   🛠️ Admin manual override for category and priority
-   🗑️ Deleted-ticket recovery, where backend routes support it
-   ⏱️ SLA target information and live countdown in ticket details
-   📈 Admin statistics for ticket totals, status, priority, and review
    needs

## 🧰 Technology Stack

  Layer            Technology
  ---------------- ------------------------------
  Frontend         React, Vite, JavaScript, CSS
  Backend          Node.js, Express
  Database         MongoDB, Mongoose
  API              REST
  Classification   Rule-based baseline
  Development      npm, Git, Nodemon

## 🗂️ Project Structure

``` text
ai-service-ticket-poc/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   └── classificationService.js
│   ├── .env                 # private; never commit
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── Auth.jsx
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

*Your actual local folder names may differ; adjust this tree to match
your repository.*

## ⚙️ Prerequisites

Install: - [Node.js](https://nodejs.org/) (LTS recommended; includes
npm) - [MongoDB](https://www.mongodb.com/) local server or Atlas -
[Git](https://git-scm.com/) - [Visual Studio
Code](https://code.visualstudio.com/) or another editor

Check installations in PowerShell:

``` powershell
node --version
npm --version
git --version
```

## 🚀 Run Locally --- Step by Step

### 1. Open the project root

Replace the path below if your project is saved elsewhere:

``` powershell
cd C:\ai-service-ticket-poc\ai-service-ticket-poc
```

The project root should contain the `backend` and `frontend` folders.

### 2. Install and configure the backend

``` powershell
cd backend
npm install
```

Create `backend/.env` if your backend uses environment variables.
Example only:

``` env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
```

Check your backend code for the **exact environment variable names** it
reads. Never upload real credentials or secrets. Start MongoDB if using
a local database, then run:

``` powershell
npm run dev
```

Expected output is similar to:

``` text
MongoDB connected successfully
Server running on http://localhost:5000
Ticket API: http://localhost:5000/api/tickets
```

If `npm run dev` is missing, inspect `backend/package.json` and
use/configure the script supported by that project (the development
command used here was Nodemon with `node server.js`).

### 3. Install and start the frontend

Keep the backend terminal running. Open a **second terminal**:

``` powershell
cd C:\ai-service-ticket-poc\ai-service-ticket-poc\frontend
npm install
npm run dev
```

Open the local URL printed by Vite, commonly `http://localhost:5173`. If
that port is occupied, Vite may print a different one.

### 4. Test the application

1.  Open the frontend URL in your browser.
2.  Sign in with an account configured for your app.
3.  Create a ticket with a title and description.
4.  Confirm that the ticket appears in the dashboard.
5.  Open ticket details and check category, priority, confidence,
    reasoning, and SLA countdown.
6.  Sign in as an administrator and test filters, dashboard statistics,
    status updates, and manual classification changes.
7.  Test delete/restore/permanent-delete only if the corresponding
    backend routes are implemented.

## 🧠 Categories, Priorities & Statuses

### Categories

-   Technical Issue
-   Billing & Payment
-   Account & Login
-   Product/Service Issue
-   Delivery/Order
-   General Query

### SLA targets used by the frontend

  Priority        First response           Resolution
  ------------- ---------------- --------------------
  🔴 Critical             1 hour              4 hours
  🟠 High                4 hours             24 hours
  🟡 Medium             24 hours             72 hours
  🟢 Low                48 hours   120 hours (5 days)

These are suggested targets in the current frontend logic, not
guaranteed service commitments. Confirm them against your organization's
policy.

### Statuses

`New` → `In Progress` → `Resolved`

## 🔌 API Overview

The frontend is configured for:

``` text
http://localhost:5000/api/tickets
```

The frontend expects routes similar to these. Confirm the exact routes
and permissions in your backend before relying on this list.

  ------------------------------------------------------------------------------
  Method                  Endpoint                       Purpose
  ----------------------- ------------------------------ -----------------------
  `GET`                   `/api/tickets`                 List/filter tickets

  `POST`                  `/api/tickets`                 Create a ticket

  `GET`                   `/api/tickets/:id`             Ticket details

  `PATCH`                 `/api/tickets/:id`             Update ticket fields

  `DELETE`                `/api/tickets/:id`             Delete/soft-delete
                                                         ticket

  `GET`                   `/api/tickets/stats`           Admin dashboard
                                                         statistics

  `PATCH`                 `/api/tickets/:id/restore`     Restore, if implemented

  `DELETE`                `/api/tickets/:id/permanent`   Permanently delete, if
                                                         implemented
  ------------------------------------------------------------------------------

## 🐙 Upload to GitHub --- Windows / PowerShell

### Step 1: Create a repository on GitHub

1.  Sign in at [GitHub](https://github.com/).
2.  Select **New repository**.
3.  Repository name: `ai-service-ticket-poc` (or your preferred name).
4.  Description:
    `AI-powered service ticket categorization and support dashboard`.
5.  Choose **Public** for a portfolio project or **Private** for
    restricted access.
6.  If you already have local files, for the simplest first push leave
    README, `.gitignore`, and license unchecked on GitHub.
7.  Create the repository and copy its HTTPS URL.

### Step 2: Create `.gitignore` in the project root

``` gitignore
node_modules/
dist/
.env
.env.*
!.env.example
coverage/
.DS_Store
Thumbs.db
npm-debug.log*
```

This prevents common generated files and private environment files from
being committed.

### Step 3: Save this document as `README.md`

Put it in the root folder, alongside `backend` and `frontend`:

``` text
ai-service-ticket-poc/
├── backend/
├── frontend/
├── .gitignore
└── README.md
```

### Step 4: Initialize Git and push

Open PowerShell in the **project root** (not inside only `backend` or
`frontend`) and run each command separately:

``` powershell
git init
git add .
git status
```

**Stop and inspect `git status` before committing.** Ensure `.env`,
credentials, `node_modules`, and private/customer data are not staged.
Fix `.gitignore` first if needed.

Then run:

``` powershell
git commit -m "Initial commit: TicketSense project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ai-service-ticket-poc.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username and use the exact URL
shown on your repository page.

If you see `remote origin already exists`, inspect the existing remote
instead of adding another:

``` powershell
git remote -v
```

If it points to the wrong repository, update it:

``` powershell
git remote set-url origin YOUR-REPOSITORY-URL
```

Follow GitHub's browser sign-in/credential prompt if asked. Never paste
passwords or tokens into the README or source files.

### Step 5: Verify the upload

1.  Refresh the GitHub repository page.
2.  Confirm `README.md`, `backend/`, and `frontend/` appear.
3.  Open README and check that headings, tables, and badges render
    correctly.
4.  Confirm `.env` and `node_modules` are not present.

### Upload future changes

From the project root:

``` powershell
git status
git add .
git commit -m "Describe your changes"
git push
```

## 🧯 Troubleshooting

  -----------------------------------------------------------------------
  Problem                             Check
  ----------------------------------- -----------------------------------
  `npm run dev` fails                 Run `npm install`; inspect the
                                      correct `package.json` scripts.

  MongoDB connection fails            Check MongoDB is running and the
                                      connection string/variable name is
                                      correct.

  Frontend cannot reach backend       Confirm backend port 5000 and
                                      inspect browser console/network
                                      errors.

  Port already in use                 Stop the other process or use the
                                      URL Vite prints.

  Push is rejected                    Check the remote URL and whether
                                      GitHub repository already contains
                                      commits.

  `.env` appears in Git status        Stop before committing, update
                                      `.gitignore`, and unstage it. If a
                                      secret was pushed, rotate it
                                      immediately.
  -----------------------------------------------------------------------

## 🔒 Security & Production Notes

-   Never publish `.env`, database credentials, JWT secrets, tokens,
    passwords, or customer data.
-   Use sample/test data for demos.
-   Before production, add robust validation, authorization, rate
    limiting, tests, secure deployment configuration, and server-side
    SLA enforcement.
-   SLA countdowns currently represent frontend target estimates; do not
    treat them as an audited SLA engine without backend enforcement.
-   The current classifier is a rule-based baseline. A trained model
    would need data, evaluation, and testing.

## 🛣️ Future Improvements

-   Add a trained text-classification model and evaluate its
    performance.
-   Add unit and integration tests.
-   Add pagination and stronger validation.
-   Make SLA policies configurable and track deadlines on the backend.
-   Deploy frontend and backend securely.
-   Add audit logs, charts, and notifications.

## 👨‍💻 Author

**Chaitanya Kolhal**

*TicketSense --- AI Service Ticket Categorization PoC*

------------------------------------------------------------------------

::: {align="center"}
⭐ If this project is useful, consider starring the repository on
GitHub.
:::
