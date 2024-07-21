import re
import pandas as pd
import F2F_scraper
import config
import wizards_tower_scraper
import scraper_401


def text_to_list() -> list[str]:
    file_object = open(config.FILENAME, "r")
    lines = file_object.readlines()
    key_list = [re.sub(r'^\d+\s+', '', item).rstrip('\n') for item in lines]

    file_object.close()
    return key_list


keyword_list = text_to_list()
master_card_list = []
f2f_card_list = []
wiz_card_list = []
g401_card_list = []

if config.IS_F2F_SCRAPE:
    print("Scraping F2F")
    f2f_card_list = F2F_scraper.scrape_f2f(keyword_list)

if config.IS_WIZ_SCRAPE:
    print("Scraping WIZ")
    wiz_card_list = wizards_tower_scraper.scrape_wizards(keyword_list)

if config.IS_401_SCRAPE:
    print("Scraping 401")
    g401_card_list = scraper_401.scrape_401(keyword_list)


master_card_list = f2f_card_list + wiz_card_list + g401_card_list


df = pd.DataFrame(master_card_list)
print(df)
print("Sorting dictionary")
df = df.sort_values(by=['card_name', 'price', 'is_foil', 'condition'])
df.to_csv(config.OUTPUT_PATH)
print("Program finished.")
