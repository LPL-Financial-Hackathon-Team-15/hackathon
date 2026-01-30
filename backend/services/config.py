import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Centralized configuration
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")

if not FINNHUB_API_KEY:
    raise RuntimeError("FINNHUB_API_KEY is not set")