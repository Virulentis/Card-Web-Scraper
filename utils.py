import logging
import re

import pandas as pd
from pandas import DataFrame

import config
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


def cost_of_deck(card_df: DataFrame) -> None:
    """
    Pulls The first time a name is used and gets the price.
    Adds the prices together to create an estimate of the deck cost.
    :param card_df: A dataset that contains names and prices.
    :return: nothing.
    """
    logger = logging.getLogger("Card_Logger")

    # card_names_group = card_df.groupby('card_name')['price'].min().reset_index()
    idx = card_df.groupby('card_name')['price'].idxmin()
    card_details = card_df.loc[idx].reset_index(drop=True)
    price = 0

    for index, row in card_details.iterrows():
        logger.info(f"{row['card_name']} \nPr: ${row['price']} Rt: {row['retailer']} Cd: {row['condition']}")
        price += row['price']

    logger.info(f"Lowest cost estimated total of ${price:.2f}")


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


def run_search(temp) -> None:
    if temp == "Full_Run":
        keyword_list = text_to_list()
    else:
        keyword_list = [temp]
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
        g401_card_list = web_interaction.find_retailer_pages(keyword_list, "401G")

    master_card_list += f2f_card_list + wiz_card_list + g401_card_list

    if master_card_list:

        df = pd.DataFrame(master_card_list)
        logger.debug(df)
        cost_of_deck(df)
        if config.OUTPUT_CSV:
            logger.info("Sorting dictionary")
            df = df.sort_values(by=['card_name', 'price', 'is_foil', 'condition'])
            df.to_csv(config.OUTPUT_PATH)
    else:
        logger.info("Failed to find.")
    logger.info("Program finished.")
