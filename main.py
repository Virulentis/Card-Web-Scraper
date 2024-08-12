import sys
from PySide6.QtWidgets import QApplication
import utils
from card_widget import CardWindow


def init_window():
    app = QApplication(sys.argv)
    window = CardWindow()
    window.show()
    sys.exit(app.exec())
def main():
    utils.instantiate_logger()
    init_window()

if __name__ == "__main__":
    main()
