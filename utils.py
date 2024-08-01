from pandas import DataFrame
import logging
import config
import re


def instantiate_logger() -> logging:
    """
    creates a logger and sets the format and color.
    :return: logger
    """
    green = '\033[01;32m'
    color = green
    logging.basicConfig(format=color + '%(message)s', level=logging.INFO)
    logger = logging.getLogger("Card_Logger")
    return logger


def text_to_list() -> list[str]:
    """
    Converts a .txt file into a list of card names.
    Expects conventional decklist notation `#   CardName`
    :return: a list of card names
    """

    file_object = open(config.FILENAME, "r")
    lines = file_object.readlines()
    key_list = [re.sub(r'^\d+\s+', '', item).rstrip('\n') for item in lines]

    file_object.close()
    return key_list


# TODO: fix issues with frames and card names that can be contained on another card.
def cost_of_deck(card_df: DataFrame) -> None:
    """
    Pulls The first time a name is used and gets the price.
    Adds the prices together to create an estimate of the deck cost.
    :param card_df: A dataset that contains names and prices.
    :return: nothing.
    """
    logger = logging.getLogger("Card_Logger")

    card_names_group = card_df.groupby('card_name')['price'].min().reset_index()
    price = 0

    for index, row in card_names_group.iterrows():
        logger.info(f"\x1b[38;5;93m{row['card_name']} \t\t {row['price']}\033[0m")
        price += row['price']

    logger.info(f"\x1b[38;5;208mEstimated total of ${price:.2f}")


def find_card_frame(full_card_name: str) -> str:
    """
    Takes the provided card name from the retailer
    and finds any frame keywords.
    :param full_card_name: Name from the retailer
    which sometimes provides frame information.
    :return: a string containing all the frame keywords
    """
    res = ""

    keywords = {"extended", "borderless", "promo", "serial numbered", "showcase", "oversized",
                "retro", "chinese", "japanese"}

    for keyword in keywords:
        if keyword in full_card_name.lower():
            if res == "":
                res += keyword
            else:
                res += f", {keyword}"
    return res
