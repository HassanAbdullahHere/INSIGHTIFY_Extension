function scrapeReviews() {
    let reviews = [];
    document.querySelectorAll(".review-text-content span").forEach((el) => {
      reviews.push(el.innerText.trim());
    });
    return reviews.slice(0, 10);
  }
  
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "getReviews") {
      sendResponse({ reviews: scrapeReviews() });
    }
  });
  