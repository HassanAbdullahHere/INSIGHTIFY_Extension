import React, { useEffect, useState } from "react";

type ScrapeState =
  | { state: "loading" }
  | { state: "not-amazon" }
  | { state: "ready"; count: number; url: string; title?: string };

type SummaryState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready"; summary: string }
  | { state: "error"; message: string };

export default function App() {
  const [scrape, setScrape] = useState<ScrapeState>({ state: "loading" });
  const [summary, setSummary] = useState<SummaryState>({ state: "idle" });

  const queryHuggingFace = async (data: any) => {
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        headers: {
          Authorization: `Bearer YOUR_API_KEY`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    const result = await response.json();
    return result;
  };

  const formatSummaryText = (text: string): string => {
    if (!text) return '';
    
    // Convert markdown-like formatting to HTML
    let formatted = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="font-semibold text-gray-200 mt-4 mb-2 text-base">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="font-bold text-gray-100 mt-4 mb-3 text-lg">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="font-bold text-gray-100 mt-4 mb-3 text-xl">$1</h1>')
      
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-100">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="font-semibold text-gray-100">$1</strong>')
      
      // Italic text
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic text-gray-300">$1</em>')
      
      // Bullet points
      .replace(/^[\s]*[-*+] (.*$)/gim, '<li class="ml-4  text-gray-300">$1</li>')
      .replace(/^[\s]*\d+\. (.*$)/gim, '<li class="ml-4  text-gray-300">$1</li>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraphs
      .replace(/^(?!<[h|l])/gm, '<p class="mb-3">')
      .replace(/(?<!>)$/gm, '</p>');
    
    // Clean up empty paragraphs and fix list formatting
    formatted = formatted
      .replace(/<p class="mb-3"><\/p>/g, '')
      .replace(/<li class="ml-4 mb-1 text-gray-300">(.*?)<\/li>/g, (match, content) => {
        // Wrap consecutive list items in ul
        return `<ul class="list-disc list-inside mb-3 space-y-1 text-gray-300"><li class="ml-4 mb-1">${content}</li></ul>`;
      })
      .replace(/<\/ul><ul class="list-disc list-inside mb-3 space-y-1 text-gray-300">/g, '')
      .replace(/<p class="mb-3"><ul/g, '<ul')
      .replace(/<\/ul><\/p>/g, '</ul>');
    
    // Add some final styling classes
    formatted = formatted
      .replace(/<h1/g, '<h1 class="font-bold text-gray-100 mt-4 mb-3 text-xl border-b border-gray-700 pb-2"')
      .replace(/<h2/g, '<h2 class="font-bold text-gray-100 mt-4 mb-3 text-lg"')
      .replace(/<h3/g, '<h3 class="font-semibold text-gray-200 mt-4 mb-2 text-base"')
      .replace(/<p class="mb-3">/g, '<p class="mb-3 text-gray-300">');
    
    return formatted;
  };
  
  
  

  const generateSummary = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      setSummary({ state: "loading" });
      
      // Get reviews from content script
      const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_REVIEWS" });
      
      if (response?.ok && response.reviews && response.reviews.length > 0) {
        const reviewsText = response.reviews.join('\n\n');
        
        const hfResponse = await queryHuggingFace({
          messages: [
            {
              role: "user",
              content: `Summarize the following Amazon product reviews in a concise, structured way. 
Use markdown headings and icons, keep it short (max 2 lines per section). 
No extra spaces or explanations.

## 📝 Overall Summary  
(Brief 1-line product overview)

## ✅ Key Strengths  
- (short positive points)  

## ⚠️ Common Issues  
- (short complaints) 

## 📊 Customer Sentiment  
(Overall: Positive / Negative / Mixed)

## 💡 Recommendation  
(1-line actionable recommendation)


Here are the reviews to analyze:\n\n${reviewsText}`,
            },
          ],
          model: "openai/gpt-oss-20b:nebius",
        });

        if (hfResponse.choices && hfResponse.choices[0]?.message?.content) {
          setSummary({ 
            state: "ready", 
            summary: hfResponse.choices[0].message.content 
          });
        } else {
          setSummary({ 
            state: "error", 
            message: "Failed to generate summary from AI response" 
          });
        }
      } else {
        setSummary({ 
          state: "error", 
          message: response?.message || "No reviews found to summarize" 
        });
      }
    } catch (error) {
      setSummary({ 
        state: "error", 
        message: "Error generating summary" 
      });
    }
  };

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

  return (
    <div className="w-[450px] min-h-[170px] p-5 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-gray-100 rounded-xl shadow-xl relative overflow-hidden">
      {/* Animated background blur orbs */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-600/30 blur-3xl rounded-full animate-pulse"></div>
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-fuchsia-500/20 blur-3xl rounded-full animate-pulse"></div>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent tracking-wide">
          Insightify
        </h1>
        <span className="text-[10px] uppercase tracking-wider text-gray-400">
          Amazon Reviews
        </span>
      </div>

      <div className="mt-6 text-sm min-h-[70px] relative z-10">
        {scrape.state === "loading" && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 animate-pulse">Scanning reviews…</p>
          </div>
        )}

        {scrape.state === "not-amazon" && (
          <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-300 backdrop-blur-md">
            ⚠️ No Amazon product detected on this tab.
          </div>
        )}

        {scrape.state === "ready" && (
          <div className="space-y-4">
            <div className="space-y-1">
              {scrape.title && (
                <div className="text-base font-medium text-gray-100 line-clamp-2">
                  {scrape.title}
                </div>
              )}
              <a
                className="text-indigo-400 hover:underline max-w-[14rem] truncate inline-block"
                href={scrape.url}
                target="_blank"
                rel="noreferrer"
              >
                {scrape.url}
              </a>
            </div>

            {scrape.count > 0 && (
              <div className="space-y-3">
                <button
                  onClick={generateSummary}
                  disabled={summary.state === "loading"}
                  className="relative w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {summary.state === "loading" && (
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  )}
                  <span>
                    {summary.state === "loading"
                      ? "Generating Summary..."
                      : "✨ Generate AI Summary"}
                  </span>
                </button>

                {summary.state === "error" && (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-300 backdrop-blur-md">
                    <div className="font-medium">❌ Error</div>
                    <div className="text-sm">{summary.message}</div>
                    <button
                      onClick={() => {}}
                      className="mt-2 text-sm text-red-400 hover:text-red-200 underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {summary.state === "ready" && (
                  <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-inner space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-100">
                        📊 AI Summary
                      </span>
                      <button
                        onClick={generateSummary}
                        className="text-xs text-indigo-400 hover:text-fuchsia-400 underline"
                      >
                        Regenerate
                      </button>
                    </div>
                    <div
                      className="text-sm text-gray-200 leading-relaxed prose prose-sm prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: formatSummaryText(summary.summary),
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-[10px] text-gray-500 text-center relative z-10">
        ⚡ Powered by Hugging Face AI
      </div>
    </div>
  );
}