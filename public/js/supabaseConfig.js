// supabaseConfig.js - Cloud Database Connection configuration & OAuth handlers

// Placeholders for Supabase credentials. Replace with your actual project keys.
window.SUPABASE_URL = "https://ymbifnphszttszuraqrw.supabase.co";
window.SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYmlmbnBoc3p0dHN6dXJhcXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMTI1MDYsImV4cCI6MjA5OTU4ODUwNn0.TFeIuyRsF-IWya46LEtMVz8TyRoADKsdHBToGOZMeFc";

window.useSupabase = false;
window.supabaseClient = null;

// Expose GitHub Sign-In Trigger
window.signInWithGitHub = async function () {
  if (!window.useSupabase) {
    showNotification("Supabase cloud database is not connected.", "error");
    return;
  }

  // Initiates redirect to GitHub OAuth page
  const { error } = await window.supabaseClient.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  });

  if (error) {
    showNotification("GitHub OAuth initialization failed: " + error.message, "error");
  }
};

// Expose Sign-Out Trigger
window.signOutUser = async function () {
  if (window.useSupabase) {
    try {
      await window.supabaseClient.auth.signOut();
      showNotification("Signed out successfully. Returning to guest session...", "info");
      // Re-sign in anonymously so page elements depending on auth.uid() don't fail
      await window.supabaseClient.auth.signInAnonymously();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Sign-out error: ", err);
    }
  }
};

// Initialize Supabase Client if keys are provided
(async function initSupabase() {
  if (
    window.SUPABASE_URL &&
    window.SUPABASE_URL !== "YOUR_SUPABASE_PROJECT_URL" &&
    window.SUPABASE_ANON_KEY &&
    window.SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY"
  ) {
    try {
      if (typeof supabase !== "undefined") {
        window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

        // Trigger Anonymous Sign-in to generate auth.uid() session for RLS if no session is active
        const { data, error } = await window.supabaseClient.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          // No active session (neither GitHub nor Anon), sign in anonymously
          const authRes = await window.supabaseClient.auth.signInAnonymously();
          if (authRes.error) throw authRes.error;
          console.log("Supabase: Anonymous authentication session initiated: ", authRes.data.user.id);
        } else {
          const isGuest = authResUserIsAnon(data.session.user);
          console.log(
            `Supabase: Active session recovered (${isGuest ? "Guest/Anon" : "GitHub Provider"}): `,
            data.session.user.id
          );
        }

        window.useSupabase = true;
        console.log("Supabase database connected successfully! Row Level Security is active.");
      } else {
        console.warn("Supabase library not loaded. Falling back to localStorage.");
      }
    } catch (err) {
      console.error("Supabase connection failed. Falling back to localStorage. Error: ", err);
      window.useSupabase = false;
    }
  } else {
    console.log("Supabase keys not configured. App is running in LocalStorage simulation mode.");
    window.useSupabase = false;
  }
})();

// Helper to check if a Supabase user is anonymous
function authResUserIsAnon(user) {
  if (!user) return true;
  return user.is_anonymous || !user.identities || user.identities.length === 0;
}
