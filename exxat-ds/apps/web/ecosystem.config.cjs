/**
 * PM2 — keep `next dev` running after the terminal closes; restarts on crash.
 * Start: `nvm use && npm run dev:daemon`
 * @see README.md — Development (daemon)
 */
module.exports = {
  apps: [
    {
      name: "exxat-ds",
      script: "npm",
      args: "run dev",
      cwd: __dirname,
      interpreter: "none",
      autorestart: true,
      max_restarts: 30,
      min_uptime: "4s",
      exp_backoff_restart_delay: 2000,
    },
  ],
}
