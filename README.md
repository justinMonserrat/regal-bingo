# Regal Bingo

A web app for a movie theater's December Bingo promotion. Customers scan a QR code, sign up, and get a digital Bingo board. Managers can log in separately and update each customer's progress by checking off squares.

## Features

### Customer Features
- **Signup**: Create account with email/password
- **Login**: Secure authentication
- **Dashboard**: View personal 5×3 Bingo board (read-only)
- Automatic board initialization on signup

### Manager Features
- **Manager Login**: Separate authentication for managers
- **User Search**: Search for customers by email
- **Board Management**: Toggle any square on/off for any user
- Real-time updates to Supabase

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the SQL from `database-schema.sql`
3. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Create a Manager Account

1. Invite or sign up the manager through the normal `/signup` flow (or add the user inside Supabase Auth > Users).
2. In Supabase, open the `public.users` table and set `is_manager` to `true` for that user's row (the new trigger will mirror this into `manager_roles`).  
   _or_ run:

   ```sql
   UPDATE public.users
   SET is_manager = TRUE
   WHERE email = 'manager@example.com';
   ```

Managers can now log in at `/manager/login` and access every customer's board. If you already had manager accounts before pulling the latest schema, flip `is_manager` to `false` and back to `true` (or re-run the UPDATE) once so the `manager_roles` table gets populated.

### 5. Run the Development Server

```bash
npm run dev
```

## Database Schema

The app uses two main tables:

- **users**: Stores user accounts with email and manager status
- **progress**: Stores Bingo board state with 15 boolean fields (square_1 through square_15)

See `database-schema.sql` for the complete schema including Row Level Security policies.

## Rewards & Promotions

The UI highlights the current prize structure:

- **Three Across** (any row of three squares) → 5,000 Regal Crown Club points
- **Five Down** (any full column of five squares) → 10,000 Regal Crown Club points

Adjust the copy or points in `Dashboard.jsx` anytime—no schema changes required.

## Tech Stack

- React 19
- Vite
- Supabase (Authentication + Database)
- React Router
- CSS with Regal orange (#ff6900) and black color scheme

## Project Structure

```
src/
  ├── lib/
  │   └── supabase.js          # Supabase client configuration
  ├── pages/
  │   ├── Signup.jsx           # Customer signup page
  │   ├── Login.jsx            # Customer login page
  │   ├── ManagerLogin.jsx     # Manager login page
  │   ├── Dashboard.jsx        # Manager dashboard and tools
  │   ├── EmailConfirmed.jsx   # Post-email confirmation screen
  │   ├── ResetPassword.jsx    # Password reset flow
  │   ├── ManagerDashboard.jsx # Manager dashboard with search & toggle
  │   ├── Auth.css             # Authentication page styles
  │   └── Dashboard.css        # Dashboard page styles
  ├── App.jsx                  # Main app with routing
  └── main.jsx                 # Entry point
```

