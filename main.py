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

# keyword_list = text_to_list()


keyword_list = ["Hapatra, Vizier of Poisons", "Grenzo", "Marchesa of the black rose"]
# keyword_list = ["Sol Ring"]
F2F_scraper.scrape_f2f(card_dict, keyword_list)
wizards_tower_scraper.scrape_wizards(card_dict, keyword_list)
scraper_401.scrape_401(card_dict, keyword_list)

df = pd.DataFrame.from_dict(card_dict)
df = df.sort_values(by=['Card_name', 'Price', 'Finish'])

print(df)
df.to_csv("results.csv")
