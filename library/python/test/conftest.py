import os
from dotenv import load_dotenv

def pytest_sessionstart(session):
    if os.path.exists('.env'):
        load_dotenv('.env')
