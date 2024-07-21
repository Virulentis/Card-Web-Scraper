from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup, PageElement
import re
import config
from classes import Card, CardCondition


# TODO: Find a better page.wait_for_selector than .hawkPrice as it is inconsistent
def scrape_f2f(keyword_list: list[str]) -> list[Card]:
    """
        Opens the FaceToFaceGames online storefront on a card name
        and gets the page html for each search of the card name.

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
                    "https://www.facetofacegames.com/search/?keyword=" + keyword +
                    "&general brand=Magic%3A The Gathering",
                    wait_until="domcontentloaded")

                page.wait_for_selector('.hawk-results__action-stockPrice',
                                       timeout=5000)
            except:
                print(keyword + ": failed")
                continue
            # time.sleep(0.5)
            html = page.inner_html('.hawk-results')

            soup = BeautifulSoup(html, 'html5lib')
            for item in soup.find_all(class_="hawk-results-item__inner"):
                card_batch = create_card_batch_F2F(keyword, item)

                if card_batch is not None:
                    res += card_batch
        print("Finished F2F")
        browser.close()
    return res


def create_card_batch_F2F(keyword: str, item: PageElement) -> list[Card] | None:
    """
        Parses information from the website into a card datatype for each different card found.

        :param keyword: Name of the card
        :param item: A part of a html page, one product entry
        :return: A list of dictionaries containing the parsed properties of the item
    """


    finish_list = []
    condition_list = []
    condition_pattern = re.compile(r'condition_')
    finish_pattern = re.compile(r'finish_')
    res = []

    card_name = item.find_next(class_="hawk-results__hawk-contentTitle").text.rstrip()

    if keyword not in card_name:
        return

    card_set = item.find_next(class_="hawk-results__hawk-contentSubtitle").text

    for finish in item.find_all(id=finish_pattern):
        for condition in item.find_all(id=condition_pattern):
            condition_list.append(condition["value"])
            finish_list.append(finish["value"])

    condition_list.reverse()
    finish_list.reverse()

    for price in item.find_all(class_="hawkPrice"):
        stock = item.find(class_="hawkStock", attrs={'data-var-id': price["data-var-id"]})[
            "data-stock-num"]

        price_tag = re.sub(r'[^0-9.]', '', price.text)

        if condition_list:
            condition_name = condition_list.pop()
            if condition_name == "NM":
                condition = CardCondition.NM.value
            elif condition_name == "PL":
                condition = CardCondition.MP.value
            elif condition_name == "HP":
                condition = CardCondition.HP.value
        else:
            condition = ""

        if finish_list:
            finish = finish_list.pop()
        else:
            finish = ""

        if finish == "Non-Foil":
            is_foil = False
        else:
            if not config.ALLOW_FOIL:
                continue
            is_foil = True

        if not config.ALLOW_OUT_OF_STOCK and int(stock) == 0:
            continue

        res_card: Card = {
            'card_name': card_name,
            'card_set': card_set,
            'condition': condition,
            'is_foil': is_foil,
            'retailer': 'F2F',
            'stock': stock,
            'price': price_tag
        }
        res.append(res_card)

    return res
