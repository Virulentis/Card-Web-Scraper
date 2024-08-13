import logging
import threading
from PySide6.QtWidgets import (QMainWindow, QPushButton, QVBoxLayout,
                               QWidget, QLabel, QCheckBox, QTabWidget, QTextEdit, \
                               QGridLayout, QLineEdit, QHBoxLayout)
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
    t1 = threading.Thread(target=utils.run_search, args=("Full_Run",))
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

        # logger instancing for gui
        self.logger_output = QTextEdit(self)
        self.logger_output.setReadOnly(True)
        log_handler = QTextEditLogger(self.logger_output)
        logger.addHandler(log_handler)

        # main page
        type_run_layout = QHBoxLayout()
        run_layout = QVBoxLayout()

        self.quick_card_name = QLineEdit()
        self.quick_card_name.setPlaceholderText("Enter single card here!")

        search_button = QPushButton("Run!")
        quick_run_button = QPushButton("Quick, Run!")

        self.quick_card_name.returnPressed.connect(self.quick_search)
        search_button.clicked.connect(start_search)
        quick_run_button.clicked.connect(self.quick_search)

        type_run_layout.addWidget(search_button)
        type_run_layout.addWidget(quick_run_button)

        run_layout.addWidget(self.quick_card_name)
        run_layout.addLayout(type_run_layout)
        run_layout.addWidget(self.logger_output)

        run_container = QWidget()
        run_container.setLayout(run_layout)

        # config page
        config_retailer = QLabel("config")
        f2f = QCheckBox("Face to Face")
        f2f.setChecked(True)
        wiz = QCheckBox("Wizards Tower")
        wiz.setChecked(True)
        g401 = QCheckBox("401 Games")
        g401.setChecked(True)
        allow_foil = QCheckBox("allow_foil")
        allow_out_of_stock = QCheckBox("allow_out_of_stock")
        f2f.stateChanged.connect(lambda: change_config("F2F"))
        wiz.stateChanged.connect(lambda: change_config("WIZ"))
        g401.stateChanged.connect(lambda: change_config("G401"))
        allow_foil.stateChanged.connect(lambda: change_config("allow_foil"))
        allow_out_of_stock.stateChanged.connect(lambda: change_config("allow_out_of_stock"))

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
        input_label = QLabel("Input Path")
        self.input_path = QLineEdit()
        self.input_path.setPlaceholderText("default = input.txt")
        output_label = QLabel("Output Path")
        self.output_path = QLineEdit()
        self.output_path.setPlaceholderText("default = result.csv")
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
        self.resulting_label.setText("Input changed!")

    def quick_search(self):
        t1 = threading.Thread(target=utils.run_search, args=(self.quick_card_name.text(),))
        self.quick_card_name.clear()
        t1.start()

