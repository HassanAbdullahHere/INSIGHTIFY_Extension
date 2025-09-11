// Content script injected on Amazon product pages

function isAmazonProductPage(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    const hostMatches = /(^|\.)amazon\./i.test(url.hostname)
    const path = url.pathname
    const pathMatches = /\/dp\//.test(path) || /\/gp\/product\//.test(path)
    return hostMatches && pathMatches
  } catch {
    return false
  }
}

function getReviewCountFromDOM(): number | null {
  // Primary: count visible review items on the page
  const reviewItems = document.querySelectorAll('[data-hook="review"]')
  if (reviewItems && reviewItems.length > 0) {
    return reviewItems.length
  }

  // Fallback: parse the total ratings/reviews text near the title
  const totalEl = document.querySelector('#acrCustomerReviewText, #acrCustomerReviewLink #acrCustomerReviewText') as HTMLElement | null
  if (totalEl && totalEl.innerText) {
    const digits = totalEl.innerText.replace(/[^0-9]/g, '')
    if (digits) {
      const parsed = Number(digits)
      if (!Number.isNaN(parsed)) return parsed
    }
  }

  return null
}

function getProductTitle(): string | null {
  const el = document.querySelector('#productTitle') as HTMLElement | null
  if (el && el.innerText) {
    return el.innerText.trim()
  }
  const alt = document.querySelector('h1.a-size-large.a-spacing-none') as HTMLElement | null
  return alt?.innerText?.trim() || null
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return

  if (message.type === 'GET_REVIEW_COUNT') {
    (async () => {
      const isProduct = isAmazonProductPage(window.location.href)
      if (!isProduct) {
        sendResponse({ ok: true, isProduct: false, count: 0 })
        return
      }
      // Try a few times to let reviews render
      let attempts = 0
      let count: number | null = null
      while (attempts < 5) {
        count = getReviewCountFromDOM()
        if (count !== null && count > 0) break
        await new Promise(r => setTimeout(r, 800))
        attempts++
      }
      const title = getProductTitle()
      sendResponse({ ok: true, isProduct: true, count: count ?? 0, title: title || '' })
    })()
    return true
  }
})


