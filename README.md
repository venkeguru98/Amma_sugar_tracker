# Diabetes Health Tracker & Personal Medical Record System

A modern, secure, responsive full-stack medical platform custom-engineered to record and monitor blood glucose levels over decades. Features senior-accessible high-contrast interfaces, localized English/Tamil language controls, and secondary vital logs.

## Core Features
- **Long-term Glycemic Logs**: Categorized ranges (Hypoglycemia, Target, Elevated, Danger) mapped with custom target scales.
- **Deep Clinical Analytics**: ADAG HbA1c estimation, standard deviation, median, rolling averages, and Linear Regression forecast projections.
- **Language Localization**: Complete native Tamil translation (`தமிழ்`) toggleable instantly from the navbar.
- **Senior Accessibility Mode**: Context-based Large Text Mode (18px base fonts) and High Contrast visualization theme options.
- **Vitals Hub**: Multi-faceted logs for Weight logs (with automated BMI calculators), Blood Pressure (systolic/diastolic/pulse), active daily medication reminders, and doctor consultation notes.
- **Medical File Cabinets**: Secure Multer file uploads for laboratory reports and prescriptions.

---

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Recharts, Framer Motion, Axios, i18next, Day.js.
- **Backend**: Node.js, Express.js, JWT security, Multer local static storage.
- **Database / ORM**: PostgreSQL (Render production) & SQLite (local dev), Prisma ORM.

---

## Quick Start (Local Setup)

The application is configured to run out-of-the-box using **SQLite** locally, requiring **zero database installations or environment configuration**.

### 1. Installation
In the project root directory, run:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Database Push & Seeding
Deploy the SQLite schema and seed the database with mock logs (from 2025 up to today) representing realistic diabetic records:
```bash
# In the project root:
npm run db:migrate
cd server && npm run db:seed
```

### 3. Run Development Server
Start the frontend and backend servers concurrently:
```bash
# In the project root:
npm run dev
```
- **Frontend** runs on: [http://localhost:5173](http://localhost:5173)
- **Backend** runs on: [http://localhost:5000](http://localhost:5000)

**Login Credentials**:
- **Email**: `amma@tracker.com`
- **Password**: `amma1234`

---

## Database Swapping Configuration

We supply an automated database toggle utility. Swapping databases rewrites the Prisma schema datasource parameter and recompiles the client query engine:

* **Switch to PostgreSQL (Production/Render)**:
  ```bash
  npm run db:postgres
  ```
* **Switch to SQLite (Local Development)**:
  ```bash
  npm run db:sqlite
  ```

---

## Deployment on Render

This repository is ready to deploy to Render via the provided `render.yaml` blueprint.

### Automatic Blueprint Deployment
1. Push this repository to GitHub or GitLab.
2. In the Render Dashboard, click **New** -> **Blueprint**.
3. Link your repository.
4. Render will automatically provision:
   - A free **PostgreSQL Database** service.
   - An **Express.js API Web Service** container.
   - A **React Static Website** container.
5. The blueprint build scripts will automatically trigger `npm run db:postgres` and run `npx prisma db push` to configure the live PostgreSQL tables instantly.
