// API Service Layer
// Base URL for the backend API - adjust if your backend runs on a different port/host
const BASE_URL = 'http://localhost:3001/api'; // Assuming backend is on port 3001

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getConfig() {
  const response = await fetch(`${BASE_URL}/config`);
  return handleResponse(response);
}

export async function updateConfig(newConfig) {
  const response = await fetch(`${BASE_URL}/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newConfig),
  });
  return handleResponse(response);
}

export async function scrapeQuick(cardName) {
  const response = await fetch(`${BASE_URL}/scrape/quick`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cardName }),
  });
  return handleResponse(response);
}

export async function scrapeFull(cardList) {
  const response = await fetch(`${BASE_URL}/scrape/full`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cardList }),
  });
  return handleResponse(response);
}

export async function analyzeDeckCost(cardData) {
  const response = await fetch(`${BASE_URL}/analyze/deck-cost`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Ensure the backend expects { cardData: [...] }
    body: JSON.stringify({ cardData }),
  });
  return handleResponse(response);
}
