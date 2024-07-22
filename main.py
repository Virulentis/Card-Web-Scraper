import re
import pandas as pd
import config
import web_interaction
import logging
import sys


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


def instantiate_logger():
    """
    creates a logger and sets the format and color.
    :return: logger
    """
    green = '\033[01;32m'
    color = green
    logging.basicConfig(format=color + '%(asctime)s %(message)s', level=logging.INFO)
    logger = logging.getLogger("Card_Logger")
    return logger


def main():
    keyword_list = text_to_list()
    master_card_list = []
    f2f_card_list = []
    wiz_card_list = []
    g401_card_list = []
    logger = instantiate_logger()

    if config.IS_F2F_SCRAPE:
        f2f_card_list = web_interaction.find_retailer_pages(keyword_list, "F2F")

    if config.IS_WIZ_SCRAPE:
        wiz_card_list = web_interaction.find_retailer_pages(keyword_list, "WIZ")

    if config.IS_401_SCRAPE:
        g401_card_list = web_interaction.find_retailer_pages(keyword_list, "G401")

    master_card_list += f2f_card_list + wiz_card_list + g401_card_list

    df = pd.DataFrame(master_card_list)
    logger.debug(df)
    logger.info("Sorting dictionary")
    df = df.sort_values(by=['card_name', 'price', 'is_foil', 'condition'])
    df.to_csv(config.OUTPUT_PATH)
    logger.info("Program finished.")


if __name__ == "__main__":
    main()
