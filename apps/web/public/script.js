(function () {
  const script = document.currentScript;
  if (!script) {
    console.warn("Collector: could not find the current script element.");
    return;
  }

  const COLLECT_URL = script.getAttribute("data-collect-api-url");
  const domainName = script.getAttribute("data-domain-name");
  const apikey = script.getAttribute("data-api-key");

  if (!COLLECT_URL) {
    console.warn("Collector: missing data-collect-api-url on script tag.");
    return;
  }

  if (!apikey) {
    console.warn("Collector: missing data-api-key on script tag.");
    return;
  }

  if (!domainName) {
    console.warn("Collector: missing data-domain-name on script tag.");
    return;
  }

  const rawPattern = script.getAttribute("data-normalize-pattern");
  let customNormalizer = null;

  if (rawPattern) {
    const parts = rawPattern.split("::");
    if (parts.length === 2) {
      try {
        const regex = new RegExp(parts[0]);
        const replacement = parts[1];
        customNormalizer = function (path) {
          return path.replace(regex, replacement);
        };
      } catch (e) {
        console.warn("Collector: invalid data-normalize-pattern, ignoring.", e);
      }
    } else {
      console.warn('Collector: data-normalize-pattern must be in "REGEX::REPLACEMENT" format, ignoring.');
    }
  }

  function normalizePage(path) {
    if (!customNormalizer) return path;
    try {
      return customNormalizer(path);
    } catch (e) {
      return path;
    }
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

  // ── INITIAL REFERRER ───────────────────────────────────────────────────────
  // Runs once, on the first load of the page.
  //   empty document.referrer        → direct visit      (referrer: null, previousPage: null)
  //   different hostname             → external source   (referrer: full URL, previousPage: null)
  //   same hostname (full page load) → internal          (referrer: null, previousPage: path)
  // The collector treats "previousPage is null" as "arrived from outside or direct".

  function parseInitialReferrer() {
    if (!document.referrer) return { referrer: null, previousPage: null };
    try {
      const strip = function (h) {
        return h.replace(/^www\./, "");
      };
      const u = new URL(document.referrer);
      if (strip(u.hostname) === strip(window.location.hostname)) {
        return { referrer: null, previousPage: normalizePage(u.pathname) };
      }
    } catch (_) {}
    return { referrer: document.referrer, previousPage: null };
  }

  const initial = parseInitialReferrer();

  // ── PAGE STATE ─────────────────────────────────────────────────────────────
  // Snapshot everything when user ARRIVES on a page.
  // Send it all when they LEAVE.

  let state = {
    page:         normalizePage(window.location.pathname),
    pageTitle:    document.title,
    referrer:     initial.referrer,
    previousPage: initial.previousPage,
    startedAt:    Date.now(),
  };

  let lastPath = window.location.pathname; // dedup guard — compare against RAW path, not normalized
  let flushed = false; // prevent double-flush

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
  // exitType tells the server WHY this flush happened:
  //   "navigation" - user moved to another page on this same site (NOT a real exit)
  //   "pagehide"   - tab/browser closing, or navigating away entirely (real exit)

  function flush(exitType) {
    send({
      apikey,
      page:         state.page, // already normalized when state was set
      pageTitle:    state.pageTitle,
      referrer:     state.referrer,
      previousPage: state.previousPage,
      timeSpent:    Math.round((Date.now() - state.startedAt) / 1000),
      browser:      getBrowser(),
      os:           getOS(),
      device:       getDevice(),
      timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
      visitedAt:    new Date(state.startedAt).toISOString(), // when they ARRIVED, not when they left
      exitType,
    });
  }

  // ── SPA NAVIGATION ─────────────────────────────────────────────────────────

  function onRouteChange() {
    const newPath = window.location.pathname;
    if (newPath === lastPath) return; // ignore hash jumps / replaceState quirks
    lastPath = newPath;

    // Remember the page they're leaving BEFORE state is replaced
    const leftPage = state.page;

    // 1. Flush the page they just left — this is NOT an exit, they're still on the site
    flush("navigation");

    // 2. Wait one tick so framework updates document.title
    setTimeout(() => {
      // 3. Snapshot the new page they've arrived on.
      //    referrer is null: document.referrer never changes in an SPA, so reusing it
      //    would repeat the original source (e.g. google.com) on every page.
      state = {
        page:         normalizePage(window.location.pathname),
        pageTitle:    document.title,
        referrer:     null,
        previousPage: leftPage,
        startedAt:    Date.now(),
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
    if (flushed) return;
    flushed = true;
    flush("pagehide");
  });

  // "hidden" (tab switch / minimize) is intentionally not flushed:
  // it's ambiguous and not useful for analytics.

  // ── INIT ───────────────────────────────────────────────────────────────────
  // Snapshot happens at top (state = ...).
  // But title might not be ready if script is in <head>.

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      state.pageTitle = document.title; // correct title once DOM is ready
    });
  }
})();