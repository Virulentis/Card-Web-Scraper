# MTG Card Scraper

## Introduction

This web scraper project is designed to collect data from three different websites: 
F2F, Wiz, and 401. The data is then processed using pandas and saved into CSV files for further analysis.

Note: if the websites change **some/all** of the program may break.


## Features

- Scrapes data from three websites: F2F, Wiz, and 401.
- Processes and cleans data using pandas.
- Saves the scraped data into CSV files.

## Requirements

- Python Version
  - Python 3.7 or higher
- `playwright`: A Python library to automate web browsers.
- `pandas`: A data manipulation and analysis library.

## Usage

...

## 401 Note

401 Games does not provide condition easily and stock 
number so a few concessions must be made:

1. Despite the condition mostly being near mint it will be left blank.
2. Stock will be boolean 1: in stock 0: not in stock.
