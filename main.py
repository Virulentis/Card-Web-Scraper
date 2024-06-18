import re
import pandas as pd
import F2F_scraper
import config
import wizards_tower_scraper
import scraper_401


def text_to_list():
    file_object = open(config.FILENAME, "r")
    lines = file_object.readlines()
    key_list = [re.sub(r'^\d+\s+', '', item).rstrip('\n') for item in lines]

    file_object.close()
    return key_list


card_dict = {'Card_name': [], 'Set': [], 'Retailer': [], 'Condition': [], 'Finish': [], 'Price': [], 'Stock': []}
keyword_list = text_to_list()

if config.IS_F2F_SCRAPE:
    print("Scraping F2F")
    F2F_scraper.scrape_f2f(card_dict, keyword_list)

if config.IS_WIZ_SCRAPE:
    print("Scraping WIZ")
    wizards_tower_scraper.scrape_wizards(card_dict, keyword_list)

if config.IS_401_SCRAPE:
    print("Scraping 401")
    scraper_401.scrape_401(card_dict, keyword_list)

df = pd.DataFrame.from_dict(card_dict)
print("Sorting dictionary")
df = df.sort_values(by=['Card_name', 'Price', 'Finish'])
df.to_csv(config.OUTPUT_PATH)
print("Program finished.")
