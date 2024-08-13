import logging
import decimal as dec
import re
from bs4 import PageElement
import config
import utils
from classes import Card, CardCondition

"""
F2F
- Borderless
- OVERSIZED
- Serial Numbered
- Etched Foil
- Extended Art

401 
- Promo Pack
- Extended Art
- Borderless
 (Etched)
 (Halo Foil)
- Extended Art

WIZ
- Borderless
(Showcase)
Oversized Foil - Atraxa, Praetors' Voice
(Showcase) - Halo Foil
Art Card
- Gilded Foil
- Foil Etched
- Oil Slick Raised Foil
- Extended Art


"""


def create_card_batch_WIZ(keyword: str, item: PageElement) -> list[Card] | None:
    """
    Parses information from the website into a card datatype for each different card found.

    :param keyword: Name of the card
    :param item: A part of a html page, one product entry
    :return: A list of dictionaries containing the parsed properties of the item
    """

    res = []
    logger = logging.getLogger("Card_Logger")
    full_card_name = item.find_next(class_="name").text
    card_name = re.sub(r"(?:\s*\(.*|\s* - .*)?", "", full_card_name)
    logger.debug(card_name)

    if keyword.lower() != card_name.lower():
        return

    card_set = item.find_next(class_="category").text
    if " Foil" in full_card_name:
        if not config.ALLOW_FOIL:
            return
        is_foil = True
    else:
        is_foil = False

    frame = utils.find_card_frame(full_card_name)

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
            'price': dec.Decimal("%0.2f" % float(dec.Decimal(price_tag))),
            'frame': frame
        }
        logger.debug(res_card)
        res.append(res_card)

    return res
