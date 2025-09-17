# Insightify - AI-Powered Amazon Review Analyzer

![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow.svg)

Insightify is a Chrome browser extension that provides AI-powered analysis of Amazon product reviews. It automatically detects Amazon product pages, scrapes customer reviews, and generates intelligent summaries using Hugging Face's AI models.

## ✨ Features

- **🔍 Automatic Detection**: Automatically detects Amazon product pages
- **📊 Review Scraping**: Intelligently scrapes customer reviews from product pages
- **🤖 AI-Powered Analysis**: Generates structured summaries using Hugging Face AI
- **📱 Modern UI**: Beautiful, responsive popup interface with gradient design
- **⚡ Real-time Processing**: Fast review analysis and summary generation
- **🎯 Smart Filtering**: Focuses on relevant review content and filters noise

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome browser
- Hugging Face API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/insightify-extension.git
   cd insightify-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   - Open `src/popup/App.tsx`
   - Replace `YOUR_API_KEY` with your Hugging Face API key on line 23

4. **Build the extension**
   ```bash
   npm run build
   ```

5. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the extension for production
- `npm run preview` - Preview the built extension

### Project Structure

```
INSIGHTIFY_Extension/
├── src/
│   ├── content/
│   │   └── scraper.ts          # Content script for Amazon page scraping
│   ├── popup/
│   │   ├── App.tsx             # Main popup React component
│   │   └── main.tsx            # Popup entry point
│   └── styles/
│       └── tailwind.css        # Tailwind CSS styles
├── public/
│   ├── background.js           # Background script
│   └── icons/                  # Extension icons
├── manifest.json               # Chrome extension manifest
├── vite.config.ts             # Vite build configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## 🔧 How It Works

### 1. Content Script (`scraper.ts`)
- Automatically injects into Amazon product pages
- Detects product pages using URL patterns (`/dp/` or `/gp/product/`)
- Scrapes product title and review data
- Implements retry logic for dynamic content loading
- Communicates with popup via Chrome messaging API

### 2. Popup Interface (`App.tsx`)
- React-based modern UI with Tailwind CSS
- Detects current tab and validates Amazon product pages
- Sends messages to content script to fetch review data
- Integrates with Hugging Face API for AI analysis
- Displays formatted summaries with markdown support

### 3. AI Integration
- Uses Hugging Face's router API for AI processing
- Leverages `openai/gpt-oss-20b:nebius` model
- Generates structured summaries with:
  - Overall product summary
  - Key strengths and common issues
  - Customer sentiment analysis
  - Actionable recommendations

## 📋 API Configuration

The extension requires a Hugging Face API key for AI functionality:

1. Sign up at [Hugging Face](https://huggingface.co/)
2. Generate an API token
3. Replace `YOUR_API_KEY` in `src/popup/App.tsx`

## 🎨 UI Features

- **Gradient Design**: Modern dark theme with indigo-to-fuchsia gradients
- **Animated Elements**: Smooth loading animations and hover effects
- **Responsive Layout**: Optimized for Chrome extension popup dimensions
- **Error Handling**: User-friendly error messages and retry options
- **Markdown Support**: Rich text formatting for AI-generated summaries

## 🔒 Permissions

The extension requires minimal permissions:
- `tabs` - To access current tab information
- `scripting` - To inject content scripts
- `*://*.amazon.com/*` - To access Amazon product pages

## 🚧 Current Status

**Version 0.2.0** - Work in Progress

### Known Issues
- API key needs to be manually configured
- Limited to Amazon.com domains
- Review scraping may need updates for Amazon UI changes

### Planned Features
- [ ] Settings page for API key configuration
- [ ] Support for international Amazon domains
- [ ] Export summaries to various formats
- [ ] Review sentiment visualization
- [ ] Product comparison features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface.co/) for AI model access
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for build tooling
- [React](https://reactjs.org/) for the UI framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/insightify-extension/issues) page
2. Create a new issue with detailed information
3. Include browser version and extension version

---

**Made with ❤️ for smarter Amazon shopping**