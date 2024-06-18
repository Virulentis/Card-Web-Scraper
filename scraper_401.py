from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import re
import config


def clean_string(s):
    s = re.sub(r'\s*\(.*?\)', '', s)
    s = s.strip()
    return s


# TODO: Figure out how to deal with redirects.
def scrape_401(card_dict, keyword_list):
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, )
        page = browser.new_page()

        for keyword in keyword_list:

            try:
                page.goto(
                    "https://store.401games.ca/pages/search-results?q=" + keyword +
                    "&filters=Category,Magic:+The+Gathering+Singles",
                    wait_until="domcontentloaded")

                page.wait_for_selector('#products-grid', timeout=5000)

            except:
                print(keyword + ": failed")
                continue

            html = page.inner_html('#products-grid')

            soup = BeautifulSoup(html, 'html5lib')

            for item in soup.find_all(class_="fs-results-product-card"):

                card_name = item.find(class_="fs-product-title")['aria-label']

                if not (keyword in card_name):
                    continue
                if "(Foil)" in card_name:
                    if not config.ALLOW_FOIL:
                        continue
                    finish = "Foil"
                else:
                    finish = "Non-Foil"

                card_name = clean_string(card_name)

                card_set = item.find(class_="fs-product-vendor").text

                price = item.find(class_="price").text

                price_tag = re.sub(r'[^0-9.]', '', price)

                if item.find(class_="in-stock") is not None:
                    stock = 1
                else:
                    if not config.ALLOW_OUT_OF_STOCK:
                        continue
                    stock = 0

                card_dict['Card_name'].append(card_name)
                card_dict['Set'].append(card_set)
                card_dict['Condition'].append("")
                card_dict['Finish'].append(finish)
                card_dict['Price'].append(price_tag)
                card_dict['Retailer'].append("401")
                card_dict['Stock'].append(stock)

        print("Finished 401")
        browser.close()
