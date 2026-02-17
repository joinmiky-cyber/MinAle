# MinAle - Localized Business Discovery Platform

MinAle is a localized business discovery platform focused on Ethiopian cities, allowing users to find cafes, gyms, salons, and more while supporting local payment methods like Telebirr and M-Pesa.

---

## 🏗 Project Architecture

- **Frontend**: Next.js (App Router), Tailwind CSS, shadcn/ui.
- **Backend**: Django (Python), Django REST Framework (API), Django Admin (CMS).
- **Database**: Supabase (PostgreSQL).
- **Storage**: Supabase Buckets (for business images).
- **Auth**: JWT (SimpleJWT) for API, Django Sessions for Admin.
- **Optimization**: Client-side image compression (down to ~200KB) for data efficiency.

---

## 🚀 Step-by-Step Setup Guide

### ☁️ Special Note for GitHub Codespaces
If you are running this in **GitHub Codespaces**, follow these extra steps:
1.  Go to the **Ports** tab in your terminal/bottom panel.
2.  Find port **8000** (Backend) and port **3000** (Frontend).
3.  Right-click the "Visibility" for both and set them to **Public**.
4.  Copy the **Forwarded Address** for port **8000**.
5.  In your `frontend/.env.local`, set `NEXT_PUBLIC_API_URL` to that address (e.g., `https://...-8000.app.github.dev/api`).

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Python 3.10 or higher**
- **Node.js 18 or higher**
- **npm** (comes with Node.js)
- A **Supabase Account** (Free tier works perfectly)

---

### 2. Backend Setup (Django)

The backend handles the data, authentication, and the administration panel.

1.  **Open your terminal and navigate to the backend folder:**
    ```bash
    cd backend
    ```

2.  **Create a Virtual Environment:**
    This keeps your project dependencies isolated.
    ```bash
    python -m venv venv
    ```

3.  **Activate the Virtual Environment:**
    - **MacOS/Linux:** `source venv/bin/activate`
    - **Windows:** `venv\Scripts\activate`

4.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configure Environment Variables:**
    Create a file named `.env` in the `backend/` directory and add your configurations:
    ```env
    DEBUG=True
    SECRET_KEY=create-a-random-long-string-here
    # Use your Supabase Connection String
    # NOTE: Use the Connection Pooler URL (Port 6543) to avoid IPv6 issues
    DATABASE_URL=postgres://postgres.[YOUR-PROJECT-ID]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
    ALLOWED_HOSTS=localhost,127.0.0.1
    ```

6.  **Initialize the Database:**
    Run migrations to create the tables in Supabase.
    ```bash
    python manage.py migrate
    ```

7.  **Seed Initial Data:**
    Populate the categories and payment methods specific to Ethiopia.
    ```bash
    python manage.py seed_data
    ```

8.  **Create your Admin Account:**
    This allows you to access the dashboard at `/admin`.
    ```bash
    python manage.py createsuperuser
    ```

9.  **Run the Server:**
    ```bash
    python manage.py runserver
    ```
    Keep this terminal open. Your backend is now live at `http://localhost:8000/`.

---

### 3. Frontend Setup (Next.js)

The frontend is the user-facing web application.

1.  **Open a NEW terminal window and navigate to the frontend folder:**
    ```bash
    cd frontend
    ```

2.  **Install Node Modules:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a file named `.env.local` in the `frontend/` directory:
    ```env
    # Points to your local Django server
    NEXT_PUBLIC_API_URL=http://localhost:8000/api

    # Get these from your Supabase Project Settings > API
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
    ```

4.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    Your app is now running at `http://localhost:3000`.

---

### 4. Supabase Storage Setup (Critical for Images)

To allow image uploads for business listings:

1.  Go to the **Supabase Dashboard**.
2.  Click on **Storage** (on the left sidebar).
3.  Click **New Bucket** and name it `places`.
4.  Click **New Bucket** and name it `reviews`.
5.  Make both buckets **Public**.
6.  **Important**: Set up "Policies" for both buckets to allow `INSERT` and `SELECT` operations. (For MVP, you can use "Allow all", but for production, restrict `INSERT` to authenticated users).

---

## 📋 Typical Workflow

### Creating a Scout
1.  Log in to `http://localhost:8000/admin`.
2.  Go to **Users** and create a new user (the Scout).
3.  Go to the MinAle website at `http://localhost:3000/login`.
4.  Log in as the Scout.

### Submitting a Business
1.  As a Scout, click **Submit Place**.
2.  Fill out the form and upload images.
3.  Once submitted, the place is "Pending." It will **not** show up on the home page yet.

### Moderation (Admin)
1.  Go back to the Django Admin (`/admin`).
2.  Go to **Places**.
3.  Find the new submission, check the details/images, and change the status to **Approved**.
4.  The business will now appear on the public home page!

### Reviewing a Business
1.  On any business detail page, click **Write a Review**.
2.  Rate the business across multiple criteria: Overall, Wi-Fi, and Cleanliness.
3.  Tag the customer service as Good or Bad.
4.  Upload photos (they will be automatically compressed to save your data).
5.  Helpful reviews can be upvoted by the community using the **Helpful** button.

---

## 🛑 Troubleshooting: "Network is unreachable" (Supabase)

If you see a `django.db.utils.OperationalError: Network is unreachable` when running migrations, it is likely because your network does not support IPv6, which Supabase uses by default for direct connections.

**The Fix:**
1.  Go to your **Supabase Dashboard** > **Project Settings** > **Database**.
2.  Find the **Connection Pooler** section.
3.  Ensure **Mode** is set to `Transaction` or `Session`.
4.  Copy the connection string (it should use port `6543`).
5.  Use this string in your `.env` file as the `DATABASE_URL`.
6.  Ensure you append `?sslmode=require` to the end of the URL.

**Codespaces CSRF Error:**
If you get a CSRF error in the Django Admin while using Codespaces:
1.  Copy your frontend's forwarded URL.
2.  In `backend/.env`, add `CSRF_TRUSTED_ORIGINS=https://your-frontend-url.app.github.dev`.

## 🚢 Deployment Tips

### Railway (Backend)
- Connect your GitHub repo.
- Railway will use the `Procfile` automatically.
- Add your `.env` variables to the **Variables** tab in Railway.

### Vercel (Frontend)
- Connect your GitHub repo.
- Add your `.env.local` variables to the **Environment Variables** section in Vercel settings.
- Ensure `NEXT_PUBLIC_API_URL` is set to your **Railway** URL.
