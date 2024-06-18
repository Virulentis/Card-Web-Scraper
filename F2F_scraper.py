from datetime import time

from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import re
import config


# TODO: Find a better page.wait_for_selector than .hawkPrice as it is inconsistent
def scrape_f2f(card_dict, keyword_list):
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, )
        page = browser.new_page()

        for keyword in keyword_list:
            page.goto(
                "https://www.facetofacegames.com/search/?keyword=" + keyword +
                "&general brand=Magic%3A The Gathering",
                wait_until="domcontentloaded")

            page.wait_for_selector('.hawkPrice',
                                   timeout=30000)
            # time.sleep(0.5)
            html = page.inner_html('.hawk-results')

            soup = BeautifulSoup(html, 'html5lib')

            for item in soup.find_all(class_="hawk-results-item__inner"):
                card_name = item.find_next(class_="hawk-results__hawk-contentTitle").text.rstrip()

                if keyword in card_name:
                    card_set = item.find_next(class_="hawk-results__hawk-contentSubtitle")

                    finish_list = []
                    condition_list = []
                    condition_pattern = re.compile(r'condition_')
                    finish_pattern = re.compile(r'finish_')

                    for finish in item.find_all(id=finish_pattern):
                        for condition in item.find_all(id=condition_pattern):
                            condition_list.append(condition["value"])
                            finish_list.append(finish["value"])

                    condition_list.reverse()
                    finish_list.reverse()

                    for price in item.find_all(class_="hawkPrice"):
                        stock = item.find(class_="hawkStock", attrs={'data-var-id': price["data-var-id"]})[
                            "data-stock-num"]

                        if not config.ALLOW_OUT_OF_STOCK and int(stock) == 0:
                            continue

                        price_tag = re.sub(r'[^0-9.]', '', price.text)

                        if condition_list:
                            condition = condition_list.pop()
                        else:
                            condition = ""

                        if finish_list:
                            finish = finish_list.pop()
                        else:
                            finish = ""

                        if not config.ALLOW_FOIL and not ("Non-Foil" in finish):
                            continue

                        card_dict['Card_name'].append(card_name)
                        card_dict['Set'].append(card_set.text)
                        card_dict['Condition'].append(condition)
                        card_dict['Finish'].append(finish)
                        card_dict['Price'].append(price_tag)
                        card_dict['Retailer'].append("F2F")
                        card_dict['Stock'].append(stock)

        browser.close()

    return
