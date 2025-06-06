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

This `README.md` is located at the root of the `card_scraper_web_app` project folder. The structure is as follows:

```
card_scraper_web_app/      # This project's root
├── backend/                 # Node.js backend application
│   ├── scrapers/            # ...
│   ├── analysis.js          # ...
│   ├── config.js            # ...
│   ├── data_structures.js   # ...
│   ├── package.json
│   └── server.js            # ...
├── frontend/                # React frontend application
│   ├── public/              # ...
│   ├── src/
│   │   ├── components/      # ...
│   │   ├── services/        # ...
│   │   ├── App.jsx          # ...
│   │   ├── index.css        # ...
│   │   └── main.jsx         # ...
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── .gitignore               # .gitignore for the card_scraper_web_app project
└── README.md                # This file
```

If this `card_scraper_web_app` folder is part of a larger repository, the paths in "Setup and Installation" and "Running the Application" should be considered relative to this folder.

## Prerequisites

- Node.js (v16 or higher recommended)
- npm (usually comes with Node.js)
- Browsers for Playwright (Chromium, Firefox, WebKit will be installed by Playwright if not present)

## Setup and Installation

1.  **Navigate to this Project Directory:**
    Ensure your terminal is in this `card_scraper_web_app` directory (i.e., the same directory as this README.md). If you've cloned a larger repository, `cd` into `card_scraper_web_app`.

2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    npx playwright install --with-deps # Installs browser binaries and OS dependencies
    cd ..
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd frontend
    npm install
    cd ..
    ```

## Running the Application

1.  **Start the Backend Server:**
    Open a terminal, navigate to the `backend` directory (from this project's root), and run:
    ```bash
    npm start
    ```
    The backend server will typically start on `http://localhost:3001`.

2.  **Start the Frontend Development Server:**
    Open another terminal, navigate to the `frontend` directory (from this project's root), and run:
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
