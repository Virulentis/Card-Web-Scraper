import logging
import re
from bs4 import PageElement
import config
from classes import Card, CardCondition


def create_card_batch_WIZ(keyword: str, item: PageElement) -> list[Card] | None:
    """
    Parses information from the website into a card datatype for each different card found.

    :param keyword: Name of the card
    :param item: A part of a html page, one product entry
    :return: A list of dictionaries containing the parsed properties of the item
    """

    res = []
    logger = logging.getLogger("Card_Logger")
    card_name = item.find_next(class_="name").text

    if not (keyword in card_name):
        return

    card_set = item.find_next(class_="category").text
    if " Foil" in card_name:
        if not config.ALLOW_FOIL:
            return
        is_foil = True
    else:
        is_foil = False

    card_name = re.sub(r"(?:\s*\(.*|\s*- Foil.*)?", "", card_name)

    for row in item.find_all(lambda tag: tag.name == 'div' and 'variant-row'
                                         in tag.get('class', []) and 'row' in tag.get('class', [])):

        stock = row.find(class_="variant-qty").text.split()[0]
        if "Out" in stock:
            if not config.ALLOW_OUT_OF_STOCK:
                continue
            stock = 0

        condition_test = row.find(class_="variant-description").text

        if "NM" in condition_test:
            condition = CardCondition.NM.value
        elif "Slightly Played" in condition_test:
            condition = CardCondition.SP.value
        elif "Moderately Played" in condition_test:
            condition = CardCondition.MP.value
        else:
            condition = ""

        price_tag = row.find(class_="regular price")

        if price_tag is None:
            price_tag = row.find(class_="price no-stock")

        price_tag = price_tag.text.split()[1]

        res_card: Card = {
            'card_name': card_name,
            'card_set': card_set,
            'condition': condition,
            'is_foil': is_foil,
            'retailer': 'WIZ',
            'stock': stock,
            'price': price_tag
        }
        logger.debug(res_card)
        res.append(res_card)


    return res
