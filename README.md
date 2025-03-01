# MTG Card Scraper

## Introduction

This web scraper project is designed to collect data from three different websites: 
Face to Face Games (F2F), Wizards Tower (WIZ), and 401 Games (401). The data is then processed using pandas and saved into CSV files for further analysis.

Note: if the websites change **some/all** of the program may break.


## Features

- Scrapes data from three websites: Face to Face Games, Wizards Tower, and 401 Games.
- Processes and cleans data using pandas.
- Saves the scraped data into CSV files.
- Provides the cheapest possible list price on completion

## Requirements

- Python Version
  - Python 3.7 or higher
- `playwright`: A Python library to automate web browsers.
- `pandas`: A data manipulation and analysis library.
- `beautifulsoup4`: A library that makes it easy to scrape information from web pages.
- `html5lib`: A pure-python library for parsing HTML.

## Installation

### The following steps will be in command prompt:

### Step 1: Clone the Repository

```bash 
git clone https://github.com/Virulentis/Card-Web-Scraper.git
cd web-scraper
```

### Step 2: Set Up a Virtual Environment

```bash
python -m venv venv
```

### Step 3: Install Required Packages

```bash
pip install -r requirements.txt
```

### Step 4: Install Playwright Browsers

```bash
playwright install
```

## Usage

### Config

to change settings open config.py and change the variable values

ALLOW_FOIL, ALLOW_OUT_OF_STOCK:
 - allows foil or out of stock cards to be added to the result.

IS_F2F_SCRAPE, IS_WIZ_SCRAPE, IS_401_SCRAPE:
 - toggle the retailer you scrape cards from.

FILENAME, OUTPUT_PATH:
 - FILENAME: path to the input file.
 - OUTPUT_PATH: path to the output file (including the results name and file extension).
  
### Running

To run the web scraper, use the following command:

```bash
python card_scraper.py
```


## 401 Note

401 Games does not provide condition easily and stock 
number so a few concessions must be made:

1. Despite the condition mostly being near mint it will be left blank.
2. Stock will be boolean 1: in stock 0: not in stock.
