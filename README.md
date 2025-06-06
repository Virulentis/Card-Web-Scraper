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
    - Dark Mode support.
    - Tabs for running scrapes and managing configuration.
- **Flexible Searching:**
    - **Quick Search:** Scrape a single card by name.
    - **Full Search:** Scrape a list of cards.
- **Configurable Options:**
    - Toggle individual retailers on/off.
    - Option to include/exclude foil cards.
    - Option to include/exclude out-of-stock cards.
- **Deck Cost Analysis:** Calculates the minimum cost to acquire a list of cards based on scraped prices.
- **Real-time Logs:** View logs from the application in the UI.

## Tech Stack

- **Backend:**
    - Node.js
    - Express.js (for API)
    - Playwright (for web scraping)
- **Frontend:**
    - React (with Vite)
    - shadcn/ui (for UI components)
    - Tailwind CSS
- **Project Management:** npm

## Project Structure

```
.
├── backend/                 # Node.js backend application
│   ├── scrapers/            # Individual scraper modules (f2f_scraper.js, etc.)
│   ├── analysis.js          # Deck cost analysis logic
│   ├── config.js            # Backend configuration (in-memory)
│   ├── data_structures.js   # Data models (e.g., CardCondition)
│   ├── package.json
│   └── server.js            # Express server and API endpoint definitions
├── frontend/                # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # UI components (shadcn/ui, theme-provider)
│   │   ├── services/        # API service layer (api.js)
│   │   ├── App.jsx          # Main application component
│   │   ├── index.css        # Global styles and Tailwind directives
│   │   └── main.jsx         # React app entry point
│   ├── package.json
│   ├── vite.config.js
│   └── ...                  # Other Vite/Tailwind configs
├── .gitignore
└── README.md                # This file
```

(Note: The above structure refers to the `card_scraper_web_app` directory if the repo root is one level above it, or the current directory if this `README.md` is at the true project root.)


## Prerequisites

- Node.js (v16 or higher recommended)
- npm (usually comes with Node.js)
- Browsers for Playwright (Chromium, Firefox, WebKit will be installed by Playwright if not present)

## Setup and Installation

1.  **Clone the Repository:**
    ```bash
    # git clone <repository_url>
    # cd <repository_directory>
    ```
    (If you cloned, ensure you are in the directory that contains `backend` and `frontend` folders, e.g., `card_scraper_web_app` if that's the sub-folder cloned, or the main repo root if it was cloned directly.)


2.  **Navigate to the project directory if applicable:**
    If the `backend` and `frontend` folders are inside a `card_scraper_web_app` sub-directory from your git clone root, `cd card_scraper_web_app`. This README should be in the same directory as `backend` and `frontend`.

3.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    npx playwright install --with-deps # Installs browser binaries and OS dependencies
    cd ..
    ```

4.  **Install Frontend Dependencies:**
    ```bash
    cd frontend
    npm install
    cd ..
    ```

## Running the Application

1.  **Start the Backend Server:**
    Open a terminal, navigate to the `backend` directory (relative to this README), and run:
    ```bash
    npm start
    ```
    The backend server will typically start on `http://localhost:3001`.

2.  **Start the Frontend Development Server:**
    Open another terminal, navigate to the `frontend` directory (relative to this README), and run:
    ```bash
    npm run dev
    ```
    The frontend development server will typically start on `http://localhost:5173` (or another port if 5173 is busy) and should open automatically in your browser.

3.  **Access the Application:**
    Open your web browser and go to the address provided by the frontend development server (e.g., `http://localhost:5173`).

## How to Use

-   **Run Scrapers Tab:**
    -   **Quick Search:** Enter a single card name and click "Search".
    -   **Full Search:** Enter a list of card names (one per line) in the textarea and click "Search List".
    -   Results from enabled retailers will be displayed in a table.
    -   Click "Analyze Deck Cost" to calculate the minimum cost for the unique cards found in the results.
-   **Configuration Tab:**
    -   Toggle switches to allow/disallow foil cards and out-of-stock items.
    -   Toggle switches to enable or disable scraping from specific retailers. Changes are sent to the backend automatically.
-   **Theme Toggle:** Use the Light/Dark mode toggle button in the header (currently shows "Lt" or "Dk").
-   **Logs:** View application activity and error messages in the Logs section at the bottom.

EOF
