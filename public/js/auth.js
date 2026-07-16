// auth.js - Custom email/password authentication views, validation, and session managers

// Render Sign-In / Login Page View
window.renderLoginView = function () {
  const appView = document.getElementById("app-view");
  if (!appView) return;

  appView.innerHTML = `
    <div class="auth-page container">
      <div class="auth-card">
        <div class="auth-header">
          <svg class="brand-logo-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 42px; height: 42px; margin: 0 auto 10px auto; display: block;">
            <path d="M10 6C10 4.34315 11.3431 3 13 3H19C20.6569 3 22 4.34315 22 6V8H26C27.6569 8 29 9.34315 29 11V25C29 27.2091 27.2091 29 25 29H7C4.79086 29 3 27.2091 3 25V11C3 9.34315 4.34315 8 6 8H10V6ZM12 6V8H20V6C20 5.44772 19.5523 5 19 5H13C12.4477 5 12 5.44772 12 6ZM8 12C7.44772 12 7 12.4477 7 13V24C7 24.5523 7.44772 25 8 25C8.55228 25 9 24.5523 9 24V13C9 12.4477 8.55228 12 8 12ZM24 12C23.4477 12 23 12.4477 23 13V24C23 24.5523 23.4477 25 24 25C24.5523 25 25 24.5523 25 24V13C25 12.4477 24.5523 12 24 12Z" fill="url(#auth-logo-grad)" />
            <path d="M16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11ZM16 19.5C14.067 19.5 12.5 17.933 12.5 16C12.5 14.067 14.067 12.5 16 12.5C17.933 12.5 19.5 14.067 19.5 16C19.5 17.933 17.933 19.5 16 19.5Z" fill="url(#auth-logo-grad)" />
            <path d="M5 23C10 21 22 21 27 23" stroke="url(#auth-logo-grad)" stroke-width="2" stroke-linecap="round" />
            <defs>
              <linearGradient id="auth-logo-grad" x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
                <stop stop-color="#00f2fe" />
                <stop offset="1" stop-color="#4facfe" />
              </linearGradient>
            </defs>
          </svg>
          <h2>Welcome Back</h2>
          <p>Sign in to your Pack Your Bags account to access bookings</p>
        </div>

        <form id="login-form" class="auth-form" onsubmit="window.handleLoginSubmit(event)">
          <div class="form-group">
            <label for="login-email">Email Address</label>
            <input type="email" id="login-email" required placeholder="name@company.com" class="form-control" />
          </div>

          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" required placeholder="••••••••" class="form-control" />
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="margin-top: 10px;">
            Sign In
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a href="#/signup">Sign Up here</a></p>
        </div>
      </div>
    </div>
  `;
};

// Render Sign-Up / Register Page View
window.renderSignUpView = function () {
  const appView = document.getElementById("app-view");
  if (!appView) return;

  appView.innerHTML = `
    <div class="auth-page container">
      <div class="auth-card">
        <div class="auth-header">
          <svg class="brand-logo-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 42px; height: 42px; margin: 0 auto 10px auto; display: block;">
            <path d="M10 6C10 4.34315 11.3431 3 13 3H19C20.6569 3 22 4.34315 22 6V8H26C27.6569 8 29 9.34315 29 11V25C29 27.2091 27.2091 29 25 29H7C4.79086 29 3 27.2091 3 25V11C3 9.34315 4.34315 8 6 8H10V6ZM12 6V8H20V6C20 5.44772 19.5523 5 19 5H13C12.4477 5 12 5.44772 12 6ZM8 12C7.44772 12 7 12.4477 7 13V24C7 24.5523 7.44772 25 8 25C8.55228 25 9 24.5523 9 24V13C9 12.4477 8.55228 12 8 12ZM24 12C23.4477 12 23 12.4477 23 13V24C23 24.5523 23.4477 25 24 25C24.5523 25 25 24.5523 25 24V13C25 12.4477 24.5523 12 24 12Z" fill="url(#auth-logo-grad)" />
            <path d="M16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11ZM16 19.5C14.067 19.5 12.5 17.933 12.5 16C12.5 14.067 14.067 12.5 16 12.5C17.933 12.5 19.5 14.067 19.5 16C19.5 17.933 17.933 19.5 16 19.5Z" fill="url(#auth-logo-grad)" />
            <path d="M5 23C10 21 22 21 27 23" stroke="url(#auth-logo-grad)" stroke-width="2" stroke-linecap="round" />
            <defs>
              <linearGradient id="auth-logo-grad" x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
                <stop stop-color="#00f2fe" />
                <stop offset="1" stop-color="#4facfe" />
              </linearGradient>
            </defs>
          </svg>
          <h2>Create Account</h2>
          <p>Register to save tickets and travel history securely</p>
        </div>

        <form id="signup-form" class="auth-form" onsubmit="window.handleSignUpSubmit(event)">
          <div class="form-group">
            <label for="signup-name">Full Name</label>
            <input type="text" id="signup-name" required placeholder="Aditya Patil" class="form-control" />
          </div>

          <div class="form-row" style="display: flex; gap: 15px;">
            <div class="form-group" style="flex: 1;">
              <label for="signup-age">Age</label>
              <input type="number" id="signup-age" required min="1" max="120" placeholder="24" class="form-control" />
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="signup-gender">Gender</label>
              <select id="signup-gender" required class="form-control">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="signup-mobile">Mobile Number</label>
            <input type="tel" id="signup-mobile" required placeholder="9876543210" class="form-control" />
          </div>

          <div class="form-group">
            <label for="signup-email">Email Address</label>
            <input type="email" id="signup-email" required placeholder="aditya@example.com" class="form-control" />
          </div>

          <div class="form-row" style="display: flex; gap: 15px;">
            <div class="form-group" style="flex: 1;">
              <label for="signup-password">Password</label>
              <input type="password" id="signup-password" required placeholder="••••••••" class="form-control" />
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="signup-confirm-password">Confirm</label>
              <input type="password" id="signup-confirm-password" required placeholder="••••••••" class="form-control" />
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="margin-top: 10px;">
            Register Account
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a href="#/login">Log In here</a></p>
        </div>
      </div>
    </div>
  `;
};

// Handle Login Submission
window.handleLoginSubmit = async function (e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  let loginSuccess = false;
  let userDetails = null;

  if (window.useSupabase && window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (!error && data.user) {
        const user = data.user;
        const meta = user.user_metadata || {};
        userDetails = {
          name: meta.full_name || "Traveler",
          age: meta.age || 24,
          gender: meta.gender || "Male",
          email: user.email,
          mobile: meta.phone || "9876543210"
        };
        loginSuccess = true;
      }
    } catch (err) {
      console.warn("Supabase login warning: ", err.message);
    }
  }

  // Fallback to local DB check if Supabase login failed or is pending
  if (!loginSuccess) {
    const db = getDB();
    const matchedUser = (db.users || []).find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (matchedUser) {
      userDetails = {
        name: matchedUser.name,
        age: matchedUser.age || 24,
        gender: matchedUser.gender || "Male",
        email: matchedUser.email,
        mobile: matchedUser.mobile || "9876543210"
      };
      loginSuccess = true;
    }
  }

  if (loginSuccess && userDetails) {
    window.appState.currentUser = {
      ...userDetails,
      savedPassengers: []
    };
    localStorage.setItem("ACTIVE_SESSION_EMAIL", userDetails.email);
    showNotification(`Logged in successfully! Welcome, ${userDetails.name}!`, "success");

    await initAppState();
    window.location.hash = "#/";
  } else {
    showNotification("Invalid email address or password.", "error");
  }
};

// Handle Sign Up Submission
window.handleSignUpSubmit = async function (e) {
  e.preventDefault();
  const name = document.getElementById("signup-name").value.trim();
  const age = parseInt(document.getElementById("signup-age").value);
  const gender = document.getElementById("signup-gender").value;
  const mobile = document.getElementById("signup-mobile").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("signup-confirm-password").value;

  if (password !== confirmPassword) {
    showNotification("Passwords do not match.", "error");
    return;
  }

  // 1. Always seed locally first to ensure instant validation and local session recovery
  const db = getDB();
  db.users = db.users || [];

  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    showNotification("An account with this email address already exists.", "error");
    return;
  }

  const newUser = {
    id: "usr-" + Math.floor(Math.random() * 1000000),
    name: name,
    age: age,
    gender: gender,
    mobile: mobile,
    email: email,
    password: password
  };

  db.users.push(newUser);
  saveDB(db);

  // 2. Synchronize to Supabase in the background
  if (window.useSupabase && window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
            age: age,
            gender: gender,
            phone: mobile
          }
        }
      });
      if (error) console.warn("Supabase signUp warning: ", error.message);
    } catch (err) {
      console.warn("Supabase background registration failed: ", err.message);
    }
  }

  window.appState.currentUser = {
    name: name,
    age: age,
    gender: gender,
    email: email,
    mobile: mobile,
    savedPassengers: []
  };

  localStorage.setItem("ACTIVE_SESSION_EMAIL", email);
  showNotification("Account registered successfully!", "success");

  await initAppState();
  window.location.hash = "#/";
};

// Handle Custom Sign Out
window.handleSignOut = async function () {
  localStorage.removeItem("ACTIVE_SESSION_EMAIL");
  window.appState.currentUser = null;

  if (window.useSupabase && window.supabaseClient) {
    try {
      await window.supabaseClient.auth.signOut();
      await window.supabaseClient.auth.signInAnonymously();
    } catch (e) {
      console.warn("Supabase SignOut issue: ", e);
    }
  }

  showNotification("Logged out successfully.", "info");
  
  // Reload state and navigate home
  await initAppState();
  window.location.hash = "#/";
};

// Helper: Retrieve database state from localStorage
function getDB() {
  const dbStr = localStorage.getItem("bookmytrip_db");
  if (!dbStr) return { users: [], bookings: [], routes: [] };
  try {
    const db = JSON.parse(dbStr);
    db.users = db.users || [];
    db.bookings = db.bookings || [];
    db.routes = db.routes || [];
    return db;
  } catch (e) {
    return { users: [], bookings: [], routes: [] };
  }
}

// Helper: Save database state to localStorage
function saveDB(db) {
  localStorage.setItem("bookmytrip_db", JSON.stringify(db));
}
