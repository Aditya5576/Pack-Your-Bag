import globals from "globals";
import html from "eslint-plugin-html";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "playwright-report/**", ".wrangler/**", "lighthouse-report/**"]
  },
  {
    files: ["**/*.js", "**/*.html"],
    plugins: {
      html
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        // Application custom cross-file globals
        CITIES: "readonly",
        showNotification: "readonly",
        navigateTo: "readonly",
        getDB: "readonly",
        formatDisplayDate: "readonly",
        initHomeView: "readonly",
        initSearchView: "readonly",
        initSeatSelectionView: "readonly",
        initCheckoutView: "readonly",
        initTicketView: "readonly",
        initMyTripsView: "readonly",
        initProfileView: "readonly",
        initAdminView: "readonly",
        supabase: "readonly",
        html2pdf: "readonly",
        QRCode: "readonly",
        confetti: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "off", // Disable unused variables for global scope script architecture compatibility
      "no-undef": "error",
      "no-console": "off",
      semi: ["error", "always"],
      quotes: ["error", "double", { avoidEscape: true }]
    }
  },
  prettier
];
