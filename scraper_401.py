import logging
import re
from bs4 import PageElement
import config
from classes import Card


def clean_string(s):
    s = re.sub(r'\s*\(.*?\)', '', s)
    s = s.strip()
    return s


def create_card_401(keyword: str, item: PageElement) -> Card | None:
    """
        Parses information from the website into a Card datatype.

        :param keyword: Name of the card
        :param item: A part of a html page, one product entry
        :return: Card datatype
    """
    logger = logging.getLogger("Card_Logger")

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
    logger.debug(res)
    return res
