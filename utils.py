import pandas as pd
from pandas import DataFrame
import logging
import config
import re

import web_interaction


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
        logger.info(f"\x1b[38;5;93m{row['card_name']} \n{row['price']}\033[0m")

        price += row['price']

    logger.info(f"\x1b[38;5;208mLowest cost estimated total of ${price:.2f}")


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


def run_search():
    keyword_list = text_to_list()
    master_card_list = []
    f2f_card_list = []
    wiz_card_list = []
    g401_card_list = []
    logger = logging.getLogger("Card_Logger")

    if config.IS_F2F_SCRAPE:
        f2f_card_list = web_interaction.find_retailer_pages(keyword_list, "F2F")

    if config.IS_WIZ_SCRAPE:
        wiz_card_list = web_interaction.find_retailer_pages(keyword_list, "WIZ")

    if config.IS_401_SCRAPE:
        g401_card_list = web_interaction.find_retailer_pages(keyword_list, "G401")

    master_card_list += f2f_card_list + wiz_card_list + g401_card_list

    if master_card_list:
        df = pd.DataFrame(master_card_list)
        logger.debug(df)
        logger.info("Sorting dictionary")
        cost_of_deck(df)
        df = df.sort_values(by=['card_name', 'price', 'is_foil', 'condition'])
        df.to_csv(config.OUTPUT_PATH)
    else:
        logger.info("\033[31;1;4mFailed to find.\033[0m")
    logger.info("\x1b[38;5;69mProgram finished.")