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
  let flushed = false; // prevent double-flush (e.g. pagehide firing right after hidden)

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
  // Called when user leaves current page (tab close, tab hide, OR SPA navigation).
  // Sends the completed visit for the page they're leaving.
  // exitType tells the server WHY this flush happened:
  //   "navigation" - user moved to another page on this same site (NOT a real exit)
  //   "pagehide"   - tab/browser closing, or navigating away entirely (real exit)
  //   "hidden"     - tab hidden (switched tabs, minimized) — ambiguous, might come back

  function flush(exitType) {
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
      exitType,
    });
  }

  // ── SPA NAVIGATION ─────────────────────────────────────────────────────────

  function onRouteChange() {
    const newPath = window.location.pathname;
    if (newPath === lastPath) return; // ignore hash jumps / replaceState quirks
    lastPath = newPath;

    // 1. Flush the page they just left — this is NOT an exit, they're still on the site
    flush("navigation");

    // 2. Wait one tick so framework updates document.title
    setTimeout(() => {
      // 3. Snapshot the new page they've arrived on
      state = {
        page:      window.location.pathname,
        pageTitle: document.title,
        referrer:  document.referrer || null,    
        startedAt: Date.now(),
      };
      flushed = false; // reset for the new page
    }, 0);
  }

  const _pushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    _pushState(...args);
    onRouteChange();
  };

  window.addEventListener("popstate", onRouteChange);

  // ── EXIT DETECTION ─────────────────────────────────────────────────────────

  window.addEventListener("pagehide", function () {
    if (flushed) return; // already sent via visibilitychange right before this
    flushed = true;
    flush("pagehide");
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && !flushed) {
      flushed = true;
      flush("hidden");
    }
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