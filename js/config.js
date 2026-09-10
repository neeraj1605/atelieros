/* ============================================================
   Planex AI — Client configuration
   Set `workerUrl` to your deployed Cloudflare Worker to enable
   the hosted Gemini assistant. Leave it empty to use the built-in
   offline assistant.
   ============================================================ */
window.PLANEX_CONFIG = {
  // e.g. "https://planex-ai.<your-subdomain>.workers.dev"
  workerUrl: '',

  // Cloudflare Turnstile site key (public). Required when workerUrl is set.
  turnstileSiteKey: '',

  // How many prior turns to include when sending grounding state.
  maxHistoryTurns: 20
};
