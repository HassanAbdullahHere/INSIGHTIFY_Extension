import React, { useEffect, useMemo, useState } from "react";

type ScrapeState =
  | { state: "loading" }
  | { state: "not-amazon" }
  | { state: "ready"; count: number; url: string; title?: string };

export default function App() {
  const [activeTab, setActiveTab] = useState("summary");
  const [scrape, setScrape] = useState<ScrapeState>({ state: "loading" });

  useEffect(() => {
    async function run() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id || !tab.url) return setScrape({ state: "not-amazon" });

        // First ask if it's a product page; show loader only for product pages
        setScrape({ state: "loading" });
        let response: any = null;
        try {
          response = await chrome.tabs.sendMessage(tab.id, { type: "GET_REVIEW_COUNT" });
        } catch (e) {
          // content not injected yet: programmatically inject then retry
          try {
            await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/scraper.js"] });
            response = await chrome.tabs.sendMessage(tab.id, { type: "GET_REVIEW_COUNT" });
          } catch {
            response = null;
          }
        }
        if (response?.ok && response.isProduct) {
          // allow page to stabilize a bit
          await new Promise((res) => setTimeout(res, 300));
          setScrape({ state: "ready", count: Number(response.count) || 0, url: tab.url, title: response.title || "" });
        } else {
          setScrape({ state: "not-amazon" });
        }
      } catch {
        setScrape({ state: "not-amazon" });
      }
    }
    run();
  }, []);

  const sentimentDummy = useMemo(() => {
    return [
      { label: "Positive", value: 68, color: "bg-green-500" },
      { label: "Neutral", value: 22, color: "bg-gray-400" },
      { label: "Negative", value: 10, color: "bg-red-500" },
    ];
  }, []);

  return (
    <div className="w-96 p-4 bg-white text-gray-900">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-indigo-600">Insightify</h1>
        <span className="text-xs text-gray-500">Amazon Reviews</span>
      </div>

      <div className="mt-3 flex space-x-2 border-b">
        {["summary", "sentiment", "fake-check"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-sm font-medium rounded-t-md ${
              activeTab === tab ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab === "summary" && "Overview"}
            {tab === "sentiment" && "Sentiment"}
            {tab === "fake-check" && "Fake Check"}
          </button>
        ))}
      </div>

      <div className="mt-4 text-sm min-h-44">
        {scrape.state === "loading" && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              <div className="text-gray-700">Scanning reviews…</div>
            </div>
            <div className="h-2 bg-gray-200 rounded overflow-hidden">
              <div className="h-2 bg-indigo-500 animate-[progress_5s_linear_forwards]" style={{ width: '100%' }} />
            </div>
            <style>{`@keyframes progress { from { transform: translateX(-100%);} to { transform: translateX(0);} }`}</style>
          </div>
        )}

        {scrape.state === "not-amazon" && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
            No Amazon product detected on this tab.
          </div>
        )}

        {scrape.state === "ready" && (
          <div>
            {activeTab === "summary" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  {scrape.title && <div className="text-base font-medium text-gray-900 line-clamp-2">{scrape.title}</div>}
                  <a className="text-indigo-600 hover:underline max-w-[14rem] truncate inline-block" href={scrape.url} target="_blank" rel="noreferrer">
                    {scrape.url}
                  </a>
                </div>
                <div className="rounded-md bg-indigo-50 p-3 text-indigo-900">
                  <div className="text-sm">Reviews scraped</div>
                  <div className="mt-1 text-2xl font-semibold">{scrape.count}</div>
                  <div className="mt-1 text-xs text-indigo-700">Summary will appear here later.</div>
                </div>
              </div>
            )}

            {activeTab === "sentiment" && (
              <div className="space-y-3">
                {sentimentDummy.map((s) => (
                  <div key={s.label} className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-700">{s.label}</span>
                      <span className="text-gray-500">{s.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded">
                      <div className={`h-2 ${s.color} rounded`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "fake-check" && (
              <div className="space-y-2">
                <div className="rounded-md bg-gray-50 p-3">
                  <div className="text-gray-700">Potential fake reviews (dummy)</div>
                  <div className="mt-1 text-2xl font-semibold">~ 7%</div>
                  <div className="mt-1 text-xs text-gray-500">We will add AI-driven detection next.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 text-[10px] text-gray-400">This is a preview UI. AI features coming next.</div>
    </div>
  );
}
