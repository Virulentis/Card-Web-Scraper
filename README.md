# MTG Card Scraper - Web Application

## Introduction

This project is a web application designed to scrape Magic: The Gathering card data from multiple online retailers. It provides a user interface to search for cards, view aggregated results, configure scraping options, and analyze deck costs.

This is a complete remake of an original Python-based CLI scraper, now built with a Node.js backend and a React frontend using Vite and shadcn/ui components.

## Features

- **Multi-Retailer Scraping:** Scrapes card data from:
    - FaceToFace Games
    - Wizards Tower (Kanatacg)
    - 401 Games
- **Web UI:** Modern user interface built with React and shadcn/ui.
    - Dark/Light mode support
    - Responsive design with tabs for running scrapes and managing configuration
- **Flexible Searching:**
    - **Quick Search:** Scrape a single card by name
    - **Full Search:** Scrape a list of cards from a textarea input
- **Configurable Options:**
    - Toggle individual retailers on/off
    - Option to include/exclude foil cards
    - Option to include/exclude out-of-stock cards
- **Deck Cost Analysis:** Calculates the minimum cost to acquire a list of cards based on scraped prices
- **Real-time Logs:** View application activity and error messages in the UI
- **Error Handling:** Comprehensive error handling with user-friendly messages

## Tech Stack

- **Backend:**
    - Node.js with Express.js (RESTful API)
    - Playwright (for web scraping with browser automation)
    - CORS middleware for cross-origin requests
- **Frontend:**
    - React 19 with Vite (fast development server)
    - shadcn/ui components with Radix UI primitives
    - Tailwind CSS for styling
    - Lucide React for icons
- **Development Tools:**
    - Concurrently for running frontend and backend simultaneously
    - ESLint for code quality
    - Hot module replacement for fast development

## Project Structure

```
card_scraper_web_app/
├── backend/                 # Node.js backend application
│   ├── scrapers/            # Individual scraper modules
│   │   ├── f2f_scraper.js   # FaceToFace Games scraper
│   │   ├── wiz_scraper.js   # Wizards Tower scraper
│   │   ├── g401_scraper.js  # 401 Games scraper
│   │   └── utils.js         # Shared scraper utilities
│   ├── analysis.js          # Deck cost analysis logic
│   ├── config.js            # Backend configuration management
│   ├── data_structures.js   # Data models (CardCondition enum, etc.)
│   ├── server.js            # Express server and API endpoints
│   └── package.json         # Backend dependencies
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/          # shadcn/ui component library
│   │   │   └── theme-provider.jsx  # Theme context provider
│   │   ├── services/        # API service layer
│   │   │   └── api.js       # Backend API communication
│   │   ├── lib/             # Utility functions
│   │   ├── App.jsx          # Main application component
│   │   ├── index.css        # Global styles and Tailwind directives
│   │   └── main.jsx         # React app entry point
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── postcss.config.js    # PostCSS configuration
├── package.json             # Root package.json with convenience scripts
└── README.md                # This file
```

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

*Note: Playwright will automatically install required browser binaries during setup.*

## Quick Start

### One-Command Setup & Launch

From the project root directory:

```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all

# Start the entire application (backend + frontend)
npm start
```

This will:
- Start the backend API server on `http://localhost:3001`
- Start the frontend development server on `http://localhost:5173`
- Automatically open the application in your browser

That's it! The application should now be running and fully functional.

## Manual Setup (Alternative)

If you prefer to set up and run components individually:

### 1. Install Dependencies

```bash
# Root dependencies (for running both services together)
npm install

# Backend dependencies
cd backend
npm install
npx playwright install --with-deps
cd ..

# Frontend dependencies  
cd frontend
npm install
cd ..
```

### 2. Run the Application

**Option A: Run both together (recommended)**
```bash
npm start
```

**Option B: Run separately**

Terminal 1 (Backend):
```bash
cd backend
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Available Scripts

From the project root:

- `npm run install:all` - Install dependencies for all parts of the application
- `npm start` - Start both backend and frontend in development mode
- `npm run dev` - Alias for `npm start`
- `npm run start:backend` - Start only the backend server
- `npm run start:frontend` - Start only the frontend development server
- `npm run build` - Build the frontend for production

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/config` - Get current scraper configuration
- `PUT /api/config` - Update scraper configuration
- `POST /api/scrape/quick` - Scrape a single card
- `POST /api/scrape/full` - Scrape multiple cards from a list
- `POST /api/analyze/deck-cost` - Analyze minimum deck cost from scraped data

## How to Use

### Run Scrapers Tab
- **Quick Search:** Enter a single card name (e.g., "Sol Ring") and click "Search"
- **Full Search:** Enter multiple card names, one per line, in the textarea and click "Search List"
- **Results:** View scraped data in a sortable table showing prices, conditions, stock, and retailer info
- **Deck Analysis:** Click "Analyze Deck Cost" to calculate the minimum cost for acquiring all unique cards

### Configuration Tab
- **Foil Cards:** Toggle to include/exclude foil versions of cards
- **Out of Stock:** Toggle to include/exclude cards that are currently out of stock
- **Retailers:** Enable or disable scraping from specific retailers (F2F, Wizards Tower, 401 Games)
- *Note: Configuration changes are automatically saved to the backend*

### Additional Features
- **Theme Toggle:** Switch between light and dark mode using the button in the header
- **Real-time Logs:** Monitor scraping progress and view error messages in the logs section
- **Error Handling:** User-friendly error messages for network issues, invalid inputs, etc.

## Development

### Project Architecture

- **Frontend:** Single-page React application with component-based architecture
- **Backend:** RESTful API with modular scraper design
- **Communication:** HTTP requests with CORS enabled for cross-origin support
- **State Management:** React hooks for local state, API calls for server state
- **Styling:** Utility-first CSS with Tailwind and pre-built shadcn/ui components

### Adding New Retailers

To add a new retailer scraper:

1. Create a new scraper file in `backend/scrapers/` (e.g., `new_retailer_scraper.js`)
2. Implement the scraping function following the existing pattern
3. Export the function and import it in `server.js`
4. Add configuration options in `backend/config.js`
5. Update the frontend configuration UI in `App.jsx`

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with `npm start`
5. Submit a pull request

## Troubleshooting

**Frontend can't connect to backend:**
- Ensure both servers are running (`npm start` or run them separately)
- Check that backend is running on port 3001 and frontend on 5173
- Verify CORS configuration in `backend/server.js`

**Scraping errors:**
- Check the logs section in the UI for specific error messages
- Ensure you have a stable internet connection
- Some retailers may have anti-bot measures that occasionally block requests

**Missing dependencies:**
- Run `npm run install:all` to ensure all dependencies are installed
- If Playwright browsers are missing, run `cd backend && npx playwright install --with-deps`

**Port conflicts:**
- Backend uses port 3001, frontend uses port 5173
- If these ports are busy, you can modify them in the respective package.json files

## License

This project is licensed under the ISC License.