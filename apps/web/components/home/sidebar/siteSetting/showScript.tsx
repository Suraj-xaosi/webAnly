"use client";

import { useState } from "react";

type Site = {
  id: string;
  domain: string;
};

export default function ShowScript({ site }: { site: Site }) {
  const { id, domain } = site;
  const [copied, setCopied] = useState(false);

  const scriptCode = `<script src="http://localhost:3000/collectorScript.js" data-site-id="${id}" data-site-name="${domain}"></script>`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="p-2 space-y-4">
      
      <button
          onClick={copyToClipboard}
          className={`text-xs px-3 py-1 rounded transition-all ${
              copied
                ? "bg-green-500/20 text-green-300"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          {copied ? "✓ Copied" : "Copy"}
      </button>
    
        <div className="px-4 py-3 overflow-x-auto">
          <code className="text-sm font-mono text-green-400 whitespace-pre-wrap break-words">
            {scriptCode}
          </code>
        </div>
      </div>
    
  );
}