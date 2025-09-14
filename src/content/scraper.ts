// contentScript.ts
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

function getProductTitle(): string | null {
  const el = document.querySelector('#productTitle') as HTMLElement | null
  if (el && el.innerText) return el.innerText.trim()
  const alt = document.querySelector('h1.a-size-large.a-spacing-none') as HTMLElement | null
  return alt?.innerText?.trim() || null
}

function getReviewCountFromDOM(): number | null {
  // Primary: count visible review items
  const reviewItems = document.querySelectorAll('[data-hook="review"]')
  if (reviewItems && reviewItems.length > 0) return reviewItems.length

  // Fallback: parse the total reviews text near the title
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

function getReviewTexts(): string[] {
  const reviews: string[] = []
  const reviewContainers = document.querySelectorAll('[data-hook="review"]')

  if (reviewContainers.length > 0) {
    reviewContainers.forEach((container) => {
      const textSelectors = [
        '[data-hook="review-body"] span',
        '.review-text-content span',
        '[data-hook="review-body"] .a-size-base',
        '.reviewText span',
        '[data-hook="review-body"]',
        '.review-text-content',
        '.a-size-base',
      ]

      for (const selector of textSelectors) {
        const textElement = container.querySelector(selector) as HTMLElement
        if (textElement && textElement.innerText) {
          const text = textElement.innerText.trim()
          if (text && text.length > 10) {
            reviews.push(text)
            break
          }
        }
      }
    })
  }

  return reviews.slice(0, 50) // Limit for performance
}

async function waitForReviews(maxRetries = 8, delay = 1000): Promise<string[]> {
  for (let i = 0; i < maxRetries; i++) {
    const reviews = getReviewTexts()
    if (reviews.length > 0) return reviews
    await new Promise((r) => setTimeout(r, delay))
  }
  return []
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

      let count: number | null = null
      for (let i = 0; i < 5; i++) {
        count = getReviewCountFromDOM()
        if (count !== null && count > 0) break
        await new Promise((r) => setTimeout(r, 800))
      }

      const title = getProductTitle()
      sendResponse({ ok: true, isProduct: true, count: count ?? 0, title: title || '' })
    })()
    return true
  }

  if (message.type === 'GET_REVIEWS') {
    (async () => {
      const isProduct = isAmazonProductPage(window.location.href)
      if (!isProduct) {
        sendResponse({ ok: true, isProduct: false, reviews: [] })
        return
      }

      const reviews = await waitForReviews()
      sendResponse({
        ok: true,
        isProduct: true,
        reviews,
        reviewCount: reviews.length,
      })
    })()
    return true
  }
})
