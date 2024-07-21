from enum import Enum
from dataclasses import dataclass
from decimal import Decimal
from typing import TypedDict, NotRequired


class CardCondition(Enum):
    """
    Represents possible conditions of cards
    """

    NM = "NM"
    SP = "SP"
    MP = "MP"
    HP = "HP"

class Card(TypedDict):
    """Represents a MTG Card
    """

    card_name: str
    card_set: str
    condition: NotRequired[CardCondition]
    is_foil: bool
    retailer: str
    stock: int
    price: str