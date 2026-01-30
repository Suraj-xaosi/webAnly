(function () {
  const COLLECT_URL = "http://localhost:4000/collect";
  const script = document.currentScript;

  const siteId = script.getAttribute("siteId");
  const siteName = script.getAttribute("siteName");
  if (!siteId) {
    console.warn("Collector.js: Please provide a site-id  attribute in script.");
    return;
  }
   
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry/i.test(ua)) return "mobile";
    return "desktop";
  }

  function getOS() {
    const p = navigator.platform.toLowerCase();
    const ua = navigator.userAgent.toLowerCase();
    if (p.includes("mac") || ua.includes("mac")) return "macOS";
    if (p.includes("win")) return "Windows";
    if (ua.includes("android")) return "Android";
    if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
    if (ua.includes("linux")) return "Linux";
    return "Unknown";
  }

  function getBrowser() {
    const ua = navigator.userAgent;
    if (/chrome|chromium|crios/i.test(ua)) return "Chrome";
    if (/firefox|fxios/i.test(ua)) return "Firefox";
    if (/safari/i.test(ua)) return "Safari";
    if (/edg/i.test(ua)) return "Edge";
    return "Unknown";
  }

  //  PAGE SESSION 
  let pageStart = Date.now();

  function send(payload) {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(COLLECT_URL, blob);
        return;
      } catch {}
    }

    fetch(COLLECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    });
  }

  function buildPayload(eventType = "pageview") {
    return {
      eventType: eventType,
      siteId: siteId,
      siteName: siteName,
      currentUrl: window.location.href,
      pathname: window.location.pathname,
      referrer: document.referrer || null,
      pageTitle: document.title || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      browser: getBrowser(),
      os: getOS(),
      device: getDeviceType(),
      timeSpent: (Date.now() - pageStart) / 1000, // seconds
      ts: new Date().toISOString(),
    };
  }

  //  INITIAL PAGE VIEW 
  send(buildPayload("pageview"));

  //  EXIT PAGE (user leaves) 
  window.addEventListener("beforeunload", function () {
    send(buildPayload("exit"));
  });

  //  SPA ROUTE CHANGES (pushState / replaceState / back forward) 
  ["pushState", "replaceState"].forEach((methodName) => {
    const original = history[methodName];
    history[methodName] = function () {
      const result = original.apply(this, arguments);
      pageStart = Date.now(); // reset timer
      send(buildPayload("route-change"));
      return result;
    };
  });

  // Back/forward button navigation
  window.addEventListener("popstate", function () {
    pageStart = Date.now();
    send(buildPayload("route-change"));
  });
})();
