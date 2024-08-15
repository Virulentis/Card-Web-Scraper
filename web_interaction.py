import logging
from typing import Any
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from F2F_scraper import create_card_batch_F2F
from scraper_401 import create_card_401
from wizards_tower_scraper import create_card_batch_WIZ


# TODO: G401 Figure out how to deal with redirects.

def find_retailer_pages(keyword_list: list[str], retailer: str) -> list[Any] | None:
    """
        Opens the online storefront on a card name
        and gets the page html for each search of the card name.

        :param retailer: 3-4 char notation for the retailer
        :param keyword_list: List of card names to search for.
        :return: List of datatype Card.
    """

    res = []
    logger = logging.getLogger("Card_Logger")
    logger.info(f"Scraping {retailer}")

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()

        for keyword in keyword_list:
            try:

                if retailer == "F2F":
                    page.goto(
                        "https://www.facetofacegames.com/search/?keyword=" + keyword +
                        "&general brand=Magic%3A The Gathering",
                        wait_until="domcontentloaded")

                    page.wait_for_selector('.hawk-results__action-stockPrice',
                                           timeout=5000)

                elif retailer == "WIZ":
                    page.goto(
                        "https://www.kanatacg.com/products/search?q=" + keyword + "&c=1",
                        wait_until="domcontentloaded")

                    page.wait_for_selector('.inner',
                                           timeout=5000)

                elif retailer == "401G":
                    page.goto(
                        "https://store.401games.ca/pages/search-results?q=" + keyword +
                        "&filters=Category,Magic:+The+Gathering+Singles",
                        wait_until="domcontentloaded")

                    page.wait_for_selector('#products-grid', timeout=5000)

                else:
                    return

            except:
                logger.info(f"{keyword}: failed, retailer {retailer}")
                continue

            if retailer == "F2F":
                html = page.inner_html('.hawk-results')

                soup = BeautifulSoup(html, 'html5lib')
                for item in soup.find_all(class_="hawk-results-item__inner"):
                    card_batch = create_card_batch_F2F(keyword, item)

                    if card_batch is not None:
                        res += card_batch

            elif retailer == "WIZ":
                html = page.inner_html('.inner')

                soup = BeautifulSoup(html, 'html5lib')
                for item in soup.find_all(class_="product enable-msrp"):
                    card_batch = create_card_batch_WIZ(keyword, item)

                    if card_batch is not None:
                        res += card_batch

            elif retailer == "401G":
                html = page.inner_html('#products-grid')

                soup = BeautifulSoup(html, 'html5lib')
                for item in soup.find_all(class_="fs-results-product-card"):
                    card = create_card_401(keyword, item)

                    if card is not None:
                        res.append(card)
            else:
                return

        logger.info(f"Finished {retailer}")
        browser.close()

    return res
