(function () {
  const script = document.currentScript;

  if (!script) {
    console.warn("Collector: could not find the current script element.");
    return;
  }

  const COLLECT_URL = script.getAttribute("data-collect-api-url");
  const apikey = script.getAttribute("data-api-key");

  if (!COLLECT_URL) {
    console.warn("Collector: missing data-collect-api-url on script tag.");
    return;
  }

  if (!apikey) {
    console.warn("Collector: missing data-api-key on script tag.");
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
      console.warn(
        'Collector: data-normalize-pattern must be in "REGEX::REPLACEMENT" format, ignoring.'
      );
    }
  }

  function normalizePage(path) {
    if (!customNormalizer) {
      return path;
    }

    try {
      const normalized = customNormalizer(path);
      return typeof normalized === "string" ? normalized : path;
    } catch (_) {
      return path;
    }
  }

  function getDevice() {
    const ua = navigator.userAgent.toLowerCase();

    const isIPad =
      /ipad/.test(ua) || (/macintosh/.test(ua) && navigator.maxTouchPoints > 1);

    const isAndroidTablet = /android/.test(ua) && !/mobile/.test(ua);

    if (isIPad || isAndroidTablet || /tablet|playbook|silk/.test(ua)) {
      return "tablet";
    }

    if (/mobile|android|iphone|ipod|iemobile|blackberry|windows phone/.test(ua)) {
      return "mobile";
    }

    return "desktop";
  }

  function getOS() {
    const ua = navigator.userAgent;

    if (/android/i.test(ua)) {
      return "Android";
    }

    if (
      /iphone|ipad|ipod/i.test(ua) ||
      (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
    ) {
      return "iOS";
    }

    if (/windows/i.test(ua)) {
      return "Windows";
    }

    if (/macintosh|mac os x|mac/i.test(ua)) {
      return "macOS";
    }

    if (/cros/i.test(ua)) {
      return "ChromeOS";
    }

    if (/linux/i.test(ua)) {
      return "Linux";
    }

    return "Unknown";
  }

  function getBrowser() {
    const ua = navigator.userAgent;

    if (/edg\/|edgios\/|edga\//i.test(ua)) {
      return "Edge";
    }

    if (/opr\/|opios\//i.test(ua)) {
      return "Opera";
    }

    if (/samsungbrowser\//i.test(ua)) {
      return "Samsung Internet";
    }

    if (/firefox\/|fxios\//i.test(ua)) {
      return "Firefox";
    }

    if (/chrome\/|chromium\/|crios\//i.test(ua)) {
      return "Chrome";
    }

    if (/safari\//i.test(ua)) {
      return "Safari";
    }

    return "Unknown";
  }

  function parseInitialReferrer() {
    if (!document.referrer) {
      return { referrer: null, previousPage: null };
    }

    try {
      const stripWww = function (hostname) {
        return hostname.replace(/^www\./i, "");
      };

      const url = new URL(document.referrer);

      if (stripWww(url.hostname) === stripWww(window.location.hostname)) {
        return { referrer: null, previousPage: normalizePage(url.pathname) };
      }
    } catch (_) {}

    return { referrer: document.referrer, previousPage: null };
  }

  const initial = parseInitialReferrer();

  let state = {
    page: normalizePage(window.location.pathname),
    pageTitle: document.title,
    referrer: initial.referrer,
    previousPage: initial.previousPage,
    startedAt: Date.now(),
  };

  let lastPath = window.location.pathname;
  let flushed = false;

  function send(payload) {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      try {
        const queued = navigator.sendBeacon(
          COLLECT_URL,
          new Blob([body], { type: "application/json" })
        );

        if (queued) {
          return;
        }
      } catch (_) {}
    }

    fetch(COLLECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(function () {});
  }

  function flush(exitType) {
    send({
      apikey,
      page: state.page,
      pageTitle: state.pageTitle,
      referrer: state.referrer,
      previousPage: state.previousPage,
      timeSpent: Math.max(0, Math.round((Date.now() - state.startedAt) / 1000)),
      browser: getBrowser(),
      os: getOS(),
      device: getDevice(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
      visitedAt: new Date(state.startedAt).toISOString(),
      exitType,
    });
  }

  function onRouteChange() {
    const newPath = window.location.pathname;

    if (newPath === lastPath) {
      return;
    }

    lastPath = newPath;

    const leftPage = state.page;

    flush("navigation");

    state = {
      page: normalizePage(newPath),
      pageTitle: document.title,
      referrer: null,
      previousPage: leftPage,
      startedAt: Date.now(),
    };

    flushed = false;
  }

  const originalPushState = history.pushState.bind(history);

  history.pushState = function (...args) {
    originalPushState(...args);
    onRouteChange();
  };

  window.addEventListener("popstate", onRouteChange);

  window.addEventListener("pagehide", function () {
    if (flushed) {
      return;
    }

    flushed = true;
    flush("pagehide");
  });

  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) {
      return;
    }

    state.startedAt = Date.now();
    state.pageTitle = document.title;
    flushed = false;
  });

  function watchTitle() {
    if (typeof MutationObserver === "undefined" || !document.head) {
      return;
    }

    const observer = new MutationObserver(function () {
      state.pageTitle = document.title;
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      state.pageTitle = document.title;
      watchTitle();
    });
  } else {
    watchTitle();
  }
})();