import logging
import threading
from PySide6.QtWidgets import (QMainWindow, QPushButton, QVBoxLayout,
                               QWidget, QLabel, QCheckBox, QTabWidget, QTextEdit, \
                               QGridLayout, QLineEdit)
import config
import utils


def change_config(config_setting):
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


def start_search():
    t1 = threading.Thread(target=utils.run_search)
    t1.start()


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
        logger = logging.getLogger("Card_Logger")

        # window settings
        self.setWindowTitle("DEFINITELY NOT A VIERUS!!11!!1!!11!!!")
        self.setGeometry(200, 200, 400, 200)
        self.setLayout(QVBoxLayout())

        search_button = QPushButton("Run!")

        config_retailer = QLabel("config")
        f2f = QCheckBox("Face to Face")
        wiz = QCheckBox("Wizards Tower")
        g401 = QCheckBox("401 Games")
        allow_foil = QCheckBox("allow_foil")
        allow_out_of_stock = QCheckBox("allow_out_of_stock")
        f2f.stateChanged.connect(lambda: change_config("F2F"))
        wiz.stateChanged.connect(lambda: change_config("WIZ"))
        g401.stateChanged.connect(lambda: change_config("G401"))
        allow_foil.stateChanged.connect(lambda: change_config("allow_foil"))
        allow_out_of_stock.stateChanged.connect(lambda: change_config("allow_out_of_stock"))
        search_button.clicked.connect(start_search)

        # logger instancing for gui
        self.logger_output = QTextEdit(self)
        self.logger_output.setReadOnly(True)
        log_handler = QTextEditLogger(self.logger_output)
        logger.addHandler(log_handler)

        # main page
        run_layout = QVBoxLayout()
        run_layout.addWidget(search_button)
        run_layout.addWidget(self.logger_output)
        run_container = QWidget()
        run_container.setLayout(run_layout)

        # config page
        config_layout = QVBoxLayout()
        config_layout.addWidget(config_retailer)
        config_layout.addWidget(f2f)
        config_layout.addWidget(wiz)
        config_layout.addWidget(g401)
        config_layout.addWidget(allow_foil)
        config_layout.addWidget(allow_out_of_stock)
        config_container = QWidget()
        config_container.setLayout(config_layout)

        # input/output page
        io_layout = QGridLayout()
        input_label = QLabel("Input Path (e.g. card_list/test.txt)")
        self.input_path = QLineEdit()
        output_label = QLabel("Output Path (e.g. result.csv)")
        self.output_path = QLineEdit()
        self.input_path.returnPressed.connect(self.change_path_input)
        self.output_path.returnPressed.connect(self.change_path_output)
        self.resulting_label = QLabel("")

        io_layout.addWidget(input_label, 2, 0)
        io_layout.addWidget(self.input_path, 3, 0)
        io_layout.addWidget(output_label, 4, 0)
        io_layout.addWidget(self.output_path, 5, 0)
        io_layout.addWidget(self.resulting_label, 1, 0)

        io_container = QWidget()
        io_container.setLayout(io_layout)

        # navigation tabs
        tab_nav = QTabWidget()
        tab_nav.addTab(run_container, "Run")
        tab_nav.addTab(config_container, "Config")
        tab_nav.addTab(io_container, "Input/Output")

        self.setCentralWidget(tab_nav)

    def change_path_input(self):
        config.FILENAME = self.input_path.text()
        self.resulting_label.setText("Output changed!")

    def change_path_output(self):
        config.OUTPUT_PATH = self.output_path.text()
        self.resulting_label.setText("Input changed! ")
