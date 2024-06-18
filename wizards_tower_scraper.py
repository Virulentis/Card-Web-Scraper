import re

from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

import config


# TODO: figure out what to do about prerelease

def scrape_wizards(card_dict, keyword_list):
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, )
        page = browser.new_page()

        for keyword in keyword_list:
            page.goto(
                "https://www.kanatacg.com/products/search?q=" + keyword + "&c=1",
                wait_until="domcontentloaded")

            page.wait_for_selector('.inner',
                                   timeout=30000)

            html = page.inner_html('.inner')

            soup = BeautifulSoup(html, 'html5lib')

            for item in soup.find_all(class_="product enable-msrp"):

                card_name = item.find_next(class_="name").text

                if not (keyword in card_name):
                    continue

                card_set = item.find_next(class_="category")
                if " Foil" in card_name:
                    if not config.ALLOW_FOIL:
                        continue
                    finish = "Foil"
                else:
                    finish = "Non-Foil"

                card_name = re.sub(r" - Foil$", "", card_name)

                for row in item.find_all(lambda tag: tag.name == 'div' and 'variant-row' in
                                                     tag.get('class', []) and 'row' in tag.get('class', [])):

                    stock = row.find(class_="variant-qty").text.split()[0]
                    if "Out" in stock:
                        if not config.ALLOW_OUT_OF_STOCK:
                            continue
                        stock = 0

                    condition_test = row.find(class_="variant-description").text
                    if "NM" in condition_test:
                        condition = "NM"
                    elif "Slightly Played" in condition_test:
                        condition = "SP"
                    elif "Moderately Played" in condition_test:
                        condition = "MP"
                    else:
                        condition = ""

                    price_tag = row.find(class_="regular price")
                    if price_tag is None:
                        price_tag = row.find(class_="price no-stock")
                    price_tag = price_tag.text.split()[1]

                    card_dict['Card_name'].append(card_name)
                    card_dict['Set'].append(card_set.text)
                    card_dict['Condition'].append(condition)
                    card_dict['Finish'].append(finish)
                    card_dict['Price'].append(price_tag)
                    card_dict['Retailer'].append("WIZ")
                    card_dict['Stock'].append(stock)
