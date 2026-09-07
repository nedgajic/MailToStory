// PM2 config for Mail To Story (Next.js production)
// Runs on the same Hostinger VPS as dt-wellness — default port 3010.
const fs = require("fs");
const path = require("path");

function loadEnvFile(envPath) {
  const env = {};
  if (!fs.existsSync(envPath)) return env;

  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) return;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (key && value) env[key] = value;
    });

  return env;
}

const rootDir = __dirname;
const envVars = loadEnvFile(path.join(rootDir, ".env"));

// Prefer explicit mailtostory port; avoid inheriting dt-wellness PORT=5173 if .env is wrong.
const port = String(
  envVars.MAILTOSTORY_PORT ||
    envVars.PORT ||
    process.env.MAILTOSTORY_PORT ||
    process.env.PORT ||
    "3010",
).trim();

module.exports = {
  apps: [
    {
      name: "mailtostory",
      script: "npm",
      args: "start",
      cwd: rootDir,
      env: {
        NODE_ENV: "production",
        PORT: port,
        ...envVars,
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",
      error_file: path.join(rootDir, "logs", "pm2-error.log"),
      out_file: path.join(rootDir, "logs", "pm2-out.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
