# Pack Your Bags (BookMyTrip) – Unified Travel Booking Platform

Developed by: **Aditya Patil**

**Pack Your Bags** (also branded as **BookMyTrip**) is a modern, high-fidelity travel booking Single Page Application (SPA). The platform allows users to search, compare, and book different modes of transportation (Buses, Trains, and Flights) from a single, unified interface. It simulates the complete travel booking lifecycle: trip discovery, interactive seat selection, coupon discounts, tax computations, payment processing via a simulated Razorpay portal, QR-enabled ticket generation, and user journey management.

---

## 🚀 Key Features

- **Unified Travel Search**: Seamless query panel supporting Bus (🚌), Train (🚆), and Flight (✈️) search queries.
- **Smart Filter & Sort**: Client-side filters (price slider, operator checkboxes) and sorting rules (cheapest, fastest, earliest departure).
- **Interactive Seat Maps**: Custom layouts built dynamically based on selected vehicle types (Bus 2x2 sleeper grids, Train compartment berths, Flight 3x3 economy rows).
- **Simulated Razorpay Modal**: Mock checkout gateway with card, UPI, and netbanking fields, complete with animated transaction processing screens.
- **Printable Boarding Pass**: High-quality ticket layouts utilizing specialized browser print `@media print` CSS configurations to support clean invoice downloads.
- **Admin Dashboard**: System diagnostics panel to track revenue and bookings, alongside a **Route Planner Wizard** that publishes new searchable schedules.
- **Dual Database Architecture**: Connects to **Supabase Cloud PostgreSQL** with an automated, seamless fallback to browser **LocalStorage** if credentials are unconfigured or offline.

---

## 🛠️ Technology Stack

1. **Frontend Core**: Vanilla HTML5, CSS3, JavaScript (ES6+ Modules).
2. **Server/Bundler**: [Vite](https://vite.dev/) (for fast hot-module reload and local hosting).
3. **Cloud Database**: [Supabase](https://supabase.com/) (PostgreSQL cloud tables).
4. **Security & Auth**: Supabase Row Level Security (RLS) and Supabase Anonymous / GitHub OAuth authentication.
5. **Interactive Libraries**: Canvas-Confetti (celebration effects) and QRCode.js (dynamic terminal scanning).

---

## 📂 File Architecture

```
BookMYTrip/
├── index.html            # Main SPA mount and CDN scripts loading
├── package.json          # Vite scripts and development dependencies
├── README.md             # Project documentation (this file)
├── supabase_schema.sql   # Database tables, UUID constraints, and RLS policies
├── css/
│   ├── style.css         # Global themes, animations, variables, and notifications
│   └── components.css    # Layout formatting for grids, seat maps, modals, and tickets
└── public/
    └── js/
        ├── app.js            # Core orchestrator and hash routing engine
        ├── supabaseConfig.js # Client setup, GitHub OAuth handlers, and fallback checks
        ├── mockData.js       # Dynamic route generator and the window.dbAPI CRUD wrapper
        ├── search.js         # Autocompletion search forms and filters logic
        ├── booking.js        # Seat selectors, fare calculations, and Razorpay simulations
        ├── ticket.js         # Confetti bursts, invoices, and printing triggers
        ├── profile.js        # Saved passenger lists and trip cancellation routines
        └── admin.js          # Admin dashboard grids and routes scheduler forms
```

---

## ⚙️ Setup & Connection Instructions

### 1. Cloud Database Integration (Supabase)

To establish the live database connection, set up a free project on [Supabase](https://supabase.com/) and follow these steps:

1. **Table Creations**:
   - Go to your Supabase Dashboard, select your project, and open the **SQL Editor** (`>_` icon on the left).
   - Click **New Query**.
   - Copy the entire SQL content from [supabase_schema.sql](file:///c:/Users/adity/Desktop/BookMYTrip/supabase_schema.sql) and paste it into the query box.
   - Click **Run** (this creates the `routes`, `bookings`, and `passengers` tables with case-sensitive columns matching the JavaScript fields).

2. **Configure Authentication Providers**:
   - Go to **Authentication** (user badge icon) ➔ **Providers** in the sub-menu.
   - Under the **Email** or **Sign-in Methods** settings card, toggle **Allow Anonymous Sign-ins** to **ON** and click **Save**. (This grants a secure guest token `auth.uid()` to visitors on page load).
   - (Optional) Toggle **GitHub** to **ON** and insert your GitHub Client ID/Secret to enable social logins. Set the redirect URI in your GitHub Developer Settings to the URL provided by Supabase.

3. **Configure API Keys in the Code**:
   - Go to **Project Settings** (gear icon on bottom left) ➔ **API**.
   - Copy the **Project URL** and the **`anon` / `public` API key**.
   - Open [public/js/supabaseConfig.js](file:///c:/Users/adity/Desktop/BookMYTrip/public/js/supabaseConfig.js) and insert them:
     ```javascript
     window.SUPABASE_URL = "https://your-project-id.supabase.co";
     window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
     ```

### 2. Local Development Server

To launch the application locally, open a terminal in the project directory:

1. **Install Dev Dependencies**:
   ```bash
   npm install
   ```
2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
3. **Open the App**: Click the link in your terminal console (usually **`http://localhost:5173/`**).

---

## 🔐 Security & Row Level Security (RLS)

The database schema utilizes strict row-level filters to secure user information:

- **Travel Routes (`routes` table)**:
  - Read access (`SELECT`) is granted to the `public` so all visitors can search for trips.
  - Modifying routes is restricted to authenticated operators or admin users.
- **Bookings (`bookings` table)** & **Passengers (`passengers` table)**:
  - Managed strictly by the policy: `auth.uid() = user_id`.
  - When a booking is placed, it is automatically tagged with the active traveler's unique Session ID.
  - Users can only view, modify, or cancel their own bookings. Database data remains private and invisible to unauthorized callers.

---

## 🔄 LocalStorage Fallback

If you open the project without entering Supabase credentials, the console will print:
`Supabase keys not configured. App is running in LocalStorage simulation mode.`

In fallback mode, all bookings and profile creations are saved locally in the browser cache (`localStorage.getItem("bookmytrip_db")`). This allows testing all functionalities, schedules, and calculations in a self-contained offline environment.
