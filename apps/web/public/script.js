//apps/web/public/script.js

/**
 * <script 
    src="http://localhost:3000/script.js" 
    data-domain-name="yourdomain.com" 
    data-api-key="your-api-key-12345">
  </script>
 */

(function () {
  const COLLECT_URL = "http://localhost:4000/collect";
  const script = document.currentScript;
  const domainName = script.getAttribute("data-domain-name");
  const apikey = script.getAttribute("data-api-key");

  if (!apikey) {
    console.warn("Collector: missing data-api-key on script tag.");
    return;
  }
  
  if (!domainName) {
    console.warn("Collector: missing data-domain-name on script tag.");
    return;
  }
  if (domainName !== window.location.hostname) {
    console.warn("Collector: data-domain-name does not match current hostname.");
  }
  

  // ── DEVICE INFO ────────────────────────────────────────────────────────────

  function getDevice() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
    if (/mobile|android|iphone|ipod|iemobile|blackberry/i.test(ua)) return "mobile";
    return "desktop";
  }

  function getOS() {
    const ua = navigator.userAgent;
    if (/windows/i.test(ua)) return "Windows";
    if (/android/i.test(ua)) return "Android";
    if (/iphone|ipad/i.test(ua)) return "iOS";
    if (/mac/i.test(ua)) return "macOS";
    if (/linux/i.test(ua)) return "Linux";
    return "Unknown";
  }

  function getBrowser() {
    const ua = navigator.userAgent;
    if (/edg\//i.test(ua)) return "Edge";
    if (/opr\//i.test(ua)) return "Opera";
    if (/chrome|chromium|crios/i.test(ua)) return "Chrome";
    if (/firefox|fxios/i.test(ua)) return "Firefox";
    if (/safari/i.test(ua)) return "Safari";
    return "Unknown";
  }

  // ── PAGE STATE ─────────────────────────────────────────────────────────────
  // Snapshot everything when user ARRIVES on a page.
  // Send it all when they LEAVE.

  let state = {
    page:      window.location.pathname,
    pageTitle: document.title,
    referrer:  document.referrer || null,
    startedAt: Date.now(),
  };

  let lastPath = state.page; // dedup guard

  // ── SEND ───────────────────────────────────────────────────────────────────

  function send(payload) {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      try {
        navigator.sendBeacon(COLLECT_URL, new Blob([body], { type: "application/json" }));
        return;
      } catch (_) {}
    }
    fetch(COLLECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }

  // ── FLUSH ──────────────────────────────────────────────────────────────────
  // Called when user leaves current page (tab close OR SPA navigation).
  // Sends the completed visit for the page they're leaving.

  function flush() {
    send({
      apikey,
      page:      state.page,
      pageTitle: state.pageTitle,
      referrer:  state.referrer,
      timeSpent: Math.round((Date.now() - state.startedAt) / 1000),
      browser:   getBrowser(),
      os:        getOS(),
      device:    getDevice(),
      timezone:  Intl.DateTimeFormat().resolvedOptions().timeZone,
      visitedAt: new Date(state.startedAt).toISOString(), // when they ARRIVED, not when they left
    });
  }

  // ── SPA NAVIGATION ─────────────────────────────────────────────────────────

  function onRouteChange() {
    const newPath = window.location.pathname;
    if (newPath === lastPath) return; // ignore hash jumps / replaceState quirks
    lastPath = newPath;

    // 1. Flush the page they just left
    flush();

    // 2. Wait one tick so framework updates document.title
    setTimeout(() => {
      // 3. Snapshot the new page they've arrived on
      state = {
        page:      window.location.pathname,
        pageTitle: document.title,
        referrer:  state.page,        // previous page becomes referrer
        startedAt: Date.now(),
      };
    }, 0);
  }

  const _pushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    _pushState(...args);
    onRouteChange();
  };

  window.addEventListener("popstate", onRouteChange);

  // ── EXIT DETECTION ─────────────────────────────────────────────────────────

  window.addEventListener("pagehide", flush);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });

  // ── INIT ───────────────────────────────────────────────────────────────────
  // Snapshot happens at top (state = ...).
  // But title might not be ready if script is in <head>.

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      state.pageTitle = document.title; // correct title once DOM is ready
    });
  }

})();