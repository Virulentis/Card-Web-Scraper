import logging
import os
import sys
import threading
from PySide6.QtGui import QIcon
from PySide6.QtWidgets import (QMainWindow, QPushButton, QVBoxLayout,
                               QWidget, QLabel, QCheckBox, QTabWidget, QTextEdit, \
                               QLineEdit, QHBoxLayout, QSpacerItem, QSizePolicy)
import config
import utils


def change_config(config_setting) -> None:
    if config_setting == "F2F":
        config.IS_F2F_SCRAPE = not config.IS_F2F_SCRAPE
    elif config_setting == "WIZ":
        config.IS_WIZ_SCRAPE = not config.IS_WIZ_SCRAPE
    elif config_setting == "G401":
        config.IS_401_SCRAPE = not config.IS_401_SCRAPE
    elif config_setting == "allow_foil":
        config.ALLOW_FOIL = not config.ALLOW_FOIL
    elif config_setting == "allow_out_of_stock":
        config.ALLOW_OUT_OF_STOCK = not config.ALLOW_OUT_OF_STOCK
    elif config_setting == "output_to_csv":
        config.OUTPUT_CSV = not config.OUTPUT_CSV


class QTextEditLogger(logging.Handler):
    def __init__(self, text_edit):
        super().__init__()
        self.text_edit = text_edit

    def emit(self, record):
        msg = self.format(record)
        self.text_edit.append(msg)


class CardWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        # icon settings
        if getattr(sys, 'frozen', False):
            icon_path = os.path.join(sys._MEIPASS, 'card_mtg.ico')
        else:
            icon_path = "card_mtg.ico"
        self.setWindowIcon(QIcon(icon_path))

        # window settings
        self.setWindowTitle("Card Scraper V.0")
        self.setGeometry(100, 100, 254, 350)
        self.setLayout(QVBoxLayout())

        # logger instancing for gui
        self.logger = logging.getLogger("Card_Logger")
        self.logger_output = QTextEdit(self)
        self.logger_output.setReadOnly(True)
        log_handler = QTextEditLogger(self.logger_output)
        self.logger.addHandler(log_handler)
        self.logger_output.setPlaceholderText("Console information is written here!")

        # main page
        type_run_layout = QHBoxLayout()
        run_layout = QVBoxLayout()

        self.quick_card_name = QLineEdit()
        self.quick_card_name.setPlaceholderText("Enter single card here!")

        self.search_button = QPushButton("Run!")
        self.quick_run_button = QPushButton("Quick, Run!")

        self.quick_card_name.returnPressed.connect(self.quick_search)
        self.search_button.clicked.connect(self.long_search)
        self.quick_run_button.clicked.connect(self.quick_search)

        type_run_layout.addWidget(self.search_button)
        type_run_layout.addWidget(self.quick_run_button)

        run_layout.addWidget(self.quick_card_name)
        run_layout.addLayout(type_run_layout)
        run_layout.addWidget(self.logger_output)

        run_container = QWidget()
        run_container.setLayout(run_layout)

        # config page
        f2f = QCheckBox("Face to Face")
        f2f.setChecked(True)
        wiz = QCheckBox("Wizards Tower")
        wiz.setChecked(True)
        g401 = QCheckBox("401 Games")
        g401.setChecked(True)
        allow_foil = QCheckBox("Allow foil")
        allow_out_of_stock = QCheckBox("Allow out of stock")
        output_to_csv = QCheckBox("Output to CSV")
        f2f.stateChanged.connect(lambda: change_config("F2F"))
        wiz.stateChanged.connect(lambda: change_config("WIZ"))
        g401.stateChanged.connect(lambda: change_config("G401"))
        allow_foil.stateChanged.connect(lambda: change_config("allow_foil"))
        allow_out_of_stock.stateChanged.connect(lambda: change_config("allow_out_of_stock"))
        output_to_csv.stateChanged.connect(lambda: change_config("output_to_csv"))
        spacer = QSpacerItem(0, 30, QSizePolicy.Minimum, QSizePolicy.Expanding)

        config_layout = QVBoxLayout()
        config_layout.addWidget(f2f)
        config_layout.addWidget(wiz)
        config_layout.addWidget(g401)
        config_layout.addWidget(allow_foil)
        config_layout.addWidget(allow_out_of_stock)
        config_layout.addWidget(output_to_csv)
        config_layout.addItem(spacer)
        config_container = QWidget()
        config_container.setLayout(config_layout)

        # input/output page
        io_layout = QVBoxLayout()

        self.input_path = QLineEdit()
        self.input_path.setPlaceholderText("default = 'input.txt'")
        self.output_path = QLineEdit()
        self.output_path.setPlaceholderText("default = 'result.csv'")
        self.input_path.returnPressed.connect(self.change_path_input)
        self.output_path.returnPressed.connect(self.change_path_output)
        self.resulting_label = QLabel("")
        io_layout.addWidget(QLabel("Input Path"))
        io_layout.addWidget(self.input_path)
        io_layout.addWidget(QLabel("Output Path"))
        io_layout.addWidget(self.output_path)
        io_layout.addWidget(self.resulting_label)
        io_layout.addItem(spacer)

        io_container = QWidget()
        io_container.setLayout(io_layout)

        # navigation tabs
        tab_nav = QTabWidget()
        tab_nav.addTab(run_container, "Run")
        tab_nav.addTab(config_container, "Config")
        tab_nav.addTab(io_container, "I/O path")

        self.setCentralWidget(tab_nav)

    def change_path_input(self) -> None:
        config.FILENAME = self.input_path.text()
        self.resulting_label.setText(f"Input changed to '{config.FILENAME}'!")

    def change_path_output(self) -> None:
        config.OUTPUT_PATH = self.output_path.text()
        self.resulting_label.setText(f"Output changed to '{config.OUTPUT_PATH}'!")

    def quick_search(self) -> None:
        if self.quick_card_name.text() == "":
            self.logger.info("No text entered in quick search. ")
            return
        self.toggle_for_run(False)
        t1 = threading.Thread(target=self.run_search, args=(self.quick_card_name.text(),))
        self.quick_card_name.clear()
        self.logger_output.clear()
        t1.start()

    def long_search(self) -> None:
        if not os.path.exists(config.FILENAME):
            self.logger.info("Missing file, cannot read.")
            return
        self.toggle_for_run(False)
        t1 = threading.Thread(target=self.run_search, args=("Full_Run",))
        self.logger_output.clear()
        t1.start()

    def run_search(self, temp: str) -> None:
        utils.run_search(temp)
        self.toggle_for_run(True)

    def toggle_for_run(self, isRunning: bool) -> None:
        self.quick_card_name.blockSignals(not isRunning)
        self.search_button.setEnabled(isRunning)
        self.quick_run_button.setEnabled(isRunning)
