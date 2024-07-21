import re
from bs4 import BeautifulSoup, PageElement
from playwright.sync_api import sync_playwright
import config
from classes import Card


def clean_string(s):
    s = re.sub(r'\s*\(.*?\)', '', s)
    s = s.strip()
    return s


# TODO: Figure out how to deal with redirects.

def scrape_401(keyword_list: list[str]) -> list[Card]:
    """
        Opens the 401 Games online storefront on a card name
        and gets the page html for each card name.

        :param keyword_list: List of card names to search for.
        :return: List of datatype Card.
    """

    res = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
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
                card = create_card_401(keyword, item)

                if card is not None:
                    res.append(card)

        print("Finished 401")
        browser.close()
    return res


def create_card_401(keyword: str, item: PageElement) -> Card | None:
    """
        Parses information from the website into a Card datatype.

        :param keyword: Name of the card
        :param item: A part of a html page, one product entry
        :return: Card datatype
    """

    card_name = item.find(class_="fs-product-title")['aria-label']

    if not (keyword in card_name):
        return
    if item.find(class_="in-stock") is not None:
        stock = 1
    else:
        if not config.ALLOW_OUT_OF_STOCK:
            return
        stock = 0
    if "(Foil)" in card_name:
        if not config.ALLOW_FOIL:
            return
        is_foil = True
    else:
        is_foil = False

    card_name = clean_string(card_name)

    card_set = item.find(class_="fs-product-vendor").text

    price = item.find(class_="price").text
    price = re.sub(r'[^0-9.]', '', price)

    res: Card = {
        'card_name': card_name,
        'card_set': card_set,
        'is_foil': is_foil,
        'retailer': '401',
        'stock': stock,
        'price': price
    }
    return res
