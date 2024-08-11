import pandas as pd
import config
import utils
import web_interaction


def main():
    keyword_list = utils.text_to_list()
    master_card_list = []
    f2f_card_list = []
    wiz_card_list = []
    g401_card_list = []
    logger = utils.instantiate_logger()

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
        utils.cost_of_deck(df)
        df = df.sort_values(by=['card_name', 'price', 'is_foil', 'condition'])
        df.to_csv(config.OUTPUT_PATH)
    else:
        logger.info("\033[31;1;4mFailed to find.\033[0m")
    logger.info("\x1b[38;5;69mProgram finished.")


if __name__ == "__main__":
    main()
