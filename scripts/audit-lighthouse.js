// scripts/audit-lighthouse.js - Automated Lighthouse Performance & Accessibility Auditor

import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5174; // Use port 5174 to avoid conflicts with other dev servers
const TARGET_URL = `http://localhost:${PORT}`;
const REPORT_DIR = path.resolve(__dirname, "../lighthouse-report");
const REPORT_PATH = path.join(REPORT_DIR, "report.html");

async function runLighthouseAudit() {
  console.log("=== Starting Automated Lighthouse Audit ===");

  // Ensure report directory exists
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // 1. Start local Vite server in background
  console.log(`- Spinning up local dev server on port ${PORT}...`);
  const serverProcess = spawn("npx", ["vite", "--port", String(PORT)], {
    stdio: "ignore",
    shell: true
  });

  // Wait 3 seconds for server to initialize
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // 2. Execute Lighthouse CLI audit
    console.log(`- Auditing ${TARGET_URL} with Lighthouse...`);
    
    // Command to execute Lighthouse CLI in headless chrome
    const lighthouseCmd = `npx lighthouse ${TARGET_URL} --output=html --output-path="${REPORT_PATH}" --chrome-flags="--headless --no-sandbox --disable-gpu" --quiet`;
    
    console.log(`- Running: ${lighthouseCmd}`);
    execSync(lighthouseCmd, { stdio: "inherit" });
    
    console.log(`\n✔ Lighthouse Audit Completed Successfully!`);
    console.log(`✔ Report saved to: ${REPORT_PATH}`);
  } catch (err) {
    console.error("❌ Lighthouse Audit failed: ", err.message);
  } finally {
    // 3. Clean up and shut down background server
    console.log("- Shutting down local dev server...");
    serverProcess.kill();
    // For Windows, ensure process tree is clean
    if (process.platform === "win32") {
      try {
        execSync(`taskkill /pid ${serverProcess.pid} /f /t`, { stdio: "ignore" });
      } catch (e) {
        // Ignore if already dead
      }
    }
    console.log("=== Audit Process Finished ===");
  }
}

runLighthouseAudit();
