from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os, time
from dotenv import load_dotenv
from sqlalchemy.exc import OperationalError

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

max_retries = 10
for i in range(max_retries):
    try:
        engine = create_engine(DATABASE_URL)
        # Try connecting
        engine.connect()
        print("Database connected")
        break
    except OperationalError:
        print(f"Database not ready, retrying {i+1}/{max_retries}...")
        time.sleep(2)
else:
    raise Exception("Could not connect to the database after several attempts")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()