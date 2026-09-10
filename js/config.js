/* ============================================================
   Planex AI — Client configuration
   ============================================================ */

window.PLANEX_CONFIG = {
  // TEMPORARY DEMO: Cloudflare quick tunnel to the local Worker running
  // REAL Gemini (chat) + Pollinations (image generation). Stays up only while
  // the Worker and tunnel run on the host machine. For a permanent endpoint,
  // deploy the Worker (see worker/README.md) and replace this URL.
  workerUrl: 'https://fifty-jpg-trusted-musicians.trycloudflare.com',

  // Cloudflare Turnstile site key. Test key (always passes); replace for production.
  turnstileSiteKey: '1x00000000000000000000AA',

  // How many prior turns to include when sending grounding state.
  maxHistoryTurns: 20
};
