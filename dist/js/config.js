/* ============================================================
   Planex AI — Client configuration
   ============================================================ */

window.PLANEX_CONFIG = {
  // TEMPORARY DEMO: Cloudflare quick tunnel to the local Worker running
  // REAL Gemini (chat) + Pollinations (image generation). Stays up only while
  // the Worker and tunnel run on the host machine. For a permanent endpoint,
  // deploy the Worker (see worker/README.md) and replace this URL.
  workerUrl: 'https://hypothesis-villa-tension-aud.trycloudflare.com',

  // Cloudflare Turnstile site key. Test key (always passes); replace for production.
  turnstileSiteKey: '1x00000000000000000000AA',

  // Real customer/demo film shown on the homepage. Leave url empty to show the
  // built-in simulated screen demo. Set url to an MP4, YouTube or Vimeo link and
  // set provider to 'mp4' | 'youtube' | 'vimeo' (optional; auto-detected).
  demoVideo: {
    url: 'assets/video/home-tour.mp4',
    provider: 'mp4',
    poster: 'assets/video/home-tour-poster.jpg'
  },

  // How many prior turns to include when sending grounding state.
  maxHistoryTurns: 20
};
