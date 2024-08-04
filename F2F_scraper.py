import decimal as dec
import logging
import re
from bs4 import PageElement
import config
import utils
from classes import Card, CardCondition


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
    logger = logging.getLogger("Card_Logger")

    full_card_name = item.find_next(class_="hawk-results__hawk-contentTitle").text.rstrip()
    card_name = re.sub(r"(?:\s*\(.*|\s* - .*)?", "", full_card_name)
    logger.debug(card_name)

    if keyword != card_name:
        return

    card_set = item.find_next(class_="hawk-results__hawk-contentSubtitle").text

    for finish in item.find_all(id=finish_pattern):
        for condition in item.find_all(id=condition_pattern):
            condition_list.append(condition["value"])
            finish_list.append(finish["value"])

    condition_list.reverse()
    finish_list.reverse()

    frame = utils.find_card_frame(full_card_name)

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
            'price': dec.Decimal("%0.2f" % float(dec.Decimal(price_tag))),
            'frame': frame
        }
        logger.debug(res_card)
        res.append(res_card)

    return res
