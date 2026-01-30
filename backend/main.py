from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import yfinance as yf
import sqlite3
from pydantic import BaseModel
import random
import pandas as pd
from typing import List
from services.finnhub_service import fetch_company_news, fetch_market_news
import os

# --- Database Setup ---
DB_FILE = "favorites.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Create table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

# --- Pydantic Models ---
class StockFavorite(BaseModel):
    ticker: str

class NewsArticle(BaseModel):
    title: str
    summary: str
    source: str
    url: str
    published: str

class CompanyNewsResponse(BaseModel):
    ticker: str
    article_count: int
    articles: List[NewsArticle]

class MarketNewsResponse(BaseModel):
    category: str
    article_count: int
    articles: List[NewsArticle]

# --- Helper Functions ---
def fetch_price_data(tickers):
    """
    Fetches current price and previous close for a list of tickers using yfinance bulk download.
    Returns a dictionary: {ticker: (current_price, previous_close)}
    """
    if not tickers:
        return {}

    try:
        # Download data for all tickers at once
        # period="5d" ensures we have enough history for previous close even after weekends
        # group_by='ticker' organizes columns by ticker
        data = yf.download(tickers, period="5d", interval="1d", group_by='ticker', progress=False, threads=True)
    except Exception as e:
        print(f"Error downloading data: {e}")
        return {}

    results = {}

    # Helper to extract data from a single-ticker DataFrame
    def extract_from_df(df):
        if df.empty or 'Close' not in df:
            return None

        # Get valid close prices
        closes = df['Close'].dropna()
        if len(closes) == 0:
            return None

        current = float(closes.iloc[-1])
        prev = None
        if len(closes) > 1:
            prev = float(closes.iloc[-2])

        return current, prev

    # Handle the structure of the returned DataFrame
    if len(tickers) == 1:
        # When only one ticker, yfinance returns a flat DataFrame (no MultiIndex columns for tickers)
        ticker = tickers[0]
        res = extract_from_df(data)
        if res:
            results[ticker] = res
    else:
        # MultiIndex columns: top level is Ticker
        for ticker in tickers:
            # Check if ticker is in the columns (it might be missing if download failed)
            if ticker in data:
                res = extract_from_df(data[ticker])
                if res:
                    results[ticker] = res

    return results

# --- FastAPI App ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()

@app.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()
    if payload.get("ref") == "refs/heads/main":
        subprocess.run(["git", "pull"], cwd="/home/ec2-user/hackathon")
    return {"status": "ok"}

@app.get("/stock/{ticker}/{period}")
def get_stock_history(ticker: str, period: str):
@app.get("/")
def read_root():
    return {"message": "Server running right now"}

@app.get("/news/company/{ticker}", response_model=CompanyNewsResponse)
def get_company_news(
    ticker: str,
    days: int = 7
):
    articles = fetch_company_news(ticker, days)
    return {
        "ticker": ticker.upper(),
        "article_count": len(articles),
        "articles": articles
    }

@app.get("/news/category/{category}", response_model=MarketNewsResponse)
def get_market_news(
    category:str="general",
    days: int=7
):
    articles = fetch_market_news(category, days)
    return {
        "category": category,
        "article_count": len(articles),
        "articles": articles
        }

@app.get("/stock/{ticker}")
def get_stock_history(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)

        if hist.empty:
            raise HTTPException(status_code=404, detail="Stock ticker not found or no data available")

        hist.reset_index(inplace=True)
        hist['Date'] = hist['Date'].dt.strftime('%Y-%m-%d')
        data = hist.to_dict(orient="records")

        return {
            "ticker": ticker.upper(),
            "history": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pinned")
def add_pinned(favorite: StockFavorite):
    ticker_symbol = favorite.ticker.upper()

    try:
        # Fetch stock info to get the name
        stock = yf.Ticker(ticker_symbol)
        stock_info = stock.info

        if not stock_info or 'longName' not in stock_info:
            raise HTTPException(status_code=404, detail=f"Could not find information for ticker: {ticker_symbol}")

        stock_name = stock_info['longName']

        # Connect to the database and insert the new favorite
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        try:
            cursor.execute("INSERT INTO favorites (ticker, name) VALUES (?, ?)", (ticker_symbol, stock_name))
            conn.commit()
        except sqlite3.IntegrityError:
            # This error occurs if the ticker is already in the database (due to UNIQUE constraint)
            conn.close()
            raise HTTPException(status_code=409, detail=f"Ticker '{ticker_symbol}' is already in favorites.")

        conn.close()

        return {"message": f"Added '{stock_name} ({ticker_symbol})' to favorites."}

    except Exception as e:
        # Catch-all for other potential errors (e.g., yfinance exceptions, db connection issues)
        if isinstance(e, HTTPException):
            raise e # Re-raise HTTPException so FastAPI handles it
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/pinned")
def get_pinned():
    try:
        # 1. Get favorited tickers from the database
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT ticker, name FROM favorites")
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return []

        favorites_data = []
        tickers = [row[0] for row in rows]
        ticker_map = {row[0]: row[1] for row in rows}

        # 2. Bulk fetch price data
        price_data = fetch_price_data(tickers)

        # 3. Construct response
        for ticker in tickers:
            stock_name = ticker_map[ticker]

            if ticker in price_data:
                current_price, previous_close = price_data[ticker]

                if current_price is not None and previous_close is not None:
                    day_change_usd = current_price - previous_close
                    day_change_percent = (day_change_usd / previous_close) * 100

                    favorites_data.append({
                        "ticker": ticker,
                        "name": stock_name,
                        "currentPrice": round(current_price, 2),
                        "costChange": round(day_change_usd, 2),
                        "percentageChange": round(day_change_percent, 2)
                    })
                else:
                     favorites_data.append({
                        "ticker": ticker,
                        "name": stock_name,
                        "currentPrice": round(current_price, 2) if current_price else None,
                        "costChange": None,
                        "percentageChange": None,
                        "error": "Insufficient price data"
                    })
            else:
                favorites_data.append({
                    "ticker": ticker,
                    "name": stock_name,
                    "currentPrice": None,
                    "costChange": None,
                    "percentageChange": None,
                    "error": "Price data unavailable"
                })

        return favorites_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.delete("/pinned/{ticker}")
def delete_pinned(ticker: str):
    ticker_symbol = ticker.upper()

    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Check if ticker exists first
        cursor.execute("SELECT ticker FROM favorites WHERE ticker = ?", (ticker_symbol,))
        if cursor.fetchone() is None:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Ticker '{ticker_symbol}' not found in favorites.")

        cursor.execute("DELETE FROM favorites WHERE ticker = ?", (ticker_symbol,))
        conn.commit()
        conn.close()

        return {"message": f"Removed '{ticker_symbol}' from favorites."}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

def get_top_tickers():
    # A hardcoded list of ~50 popular North American stocks
    return [
        {"ticker": "AAPL", "name": "Apple Inc."},
        {"ticker": "MSFT", "name": "Microsoft Corporation"},
        {"ticker": "GOOGL", "name": "Alphabet Inc."},
        {"ticker": "AMZN", "name": "Amazon.com, Inc."},
        {"ticker": "TSLA", "name": "Tesla, Inc."},
        {"ticker": "NVDA", "name": "NVIDIA Corporation"},
        {"ticker": "META", "name": "Meta Platforms, Inc."},
        {"ticker": "NFLX", "name": "Netflix, Inc."},
        {"ticker": "AMD", "name": "Advanced Micro Devices, Inc."},
        {"ticker": "INTC", "name": "Intel Corporation"},
        {"ticker": "SPY", "name": "SPDR S&P 500 ETF Trust"},
        {"ticker": "QQQ", "name": "Invesco QQQ Trust"},
        {"ticker": "JPM", "name": "JPMorgan Chase & Co."},
        {"ticker": "BAC", "name": "Bank of America Corporation"},
        {"ticker": "WFC", "name": "Wells Fargo & Company"},
        {"ticker": "C", "name": "Citigroup Inc."},
        {"ticker": "GS", "name": "The Goldman Sachs Group, Inc."},
        {"ticker": "MS", "name": "Morgan Stanley"},
        {"ticker": "V", "name": "Visa Inc."},
        {"ticker": "MA", "name": "Mastercard Incorporated"},
        {"ticker": "JNJ", "name": "Johnson & Johnson"},
        {"ticker": "PFE", "name": "Pfizer Inc."},
        {"ticker": "MRK", "name": "Merck & Co., Inc."},
        {"ticker": "ABBV", "name": "AbbVie Inc."},
        {"ticker": "LLY", "name": "Eli Lilly and Company"},
        {"ticker": "UNH", "name": "UnitedHealth Group Incorporated"},
        {"ticker": "CVS", "name": "CVS Health Corporation"},
        {"ticker": "WMT", "name": "Walmart Inc."},
        {"ticker": "TGT", "name": "Target Corporation"},
        {"ticker": "COST", "name": "Costco Wholesale Corporation"},
        {"ticker": "HD", "name": "The Home Depot, Inc."},
        {"ticker": "LOW", "name": "Lowe's Companies, Inc."},
        {"ticker": "MCD", "name": "McDonald's Corporation"},
        {"ticker": "SBUX", "name": "Starbucks Corporation"},
        {"ticker": "NKE", "name": "NIKE, Inc."},
        {"ticker": "DIS", "name": "The Walt Disney Company"},
        {"ticker": "CMCSA", "name": "Comcast Corporation"},
        {"ticker": "VZ", "name": "Verizon Communications Inc."},
        {"ticker": "T", "name": "AT&T Inc."},
        {"ticker": "TMUS", "name": "T-Mobile US, Inc."},
        {"ticker": "XOM", "name": "Exxon Mobil Corporation"},
        {"ticker": "CVX", "name": "Chevron Corporation"},
        {"ticker": "COP", "name": "ConocoPhillips"},
        {"ticker": "SLB", "name": "Schlumberger Limited"},
        {"ticker": "EOG", "name": "EOG Resources, Inc."},
        {"ticker": "BA", "name": "The Boeing Company"},
        {"ticker": "LMT", "name": "Lockheed Martin Corporation"},
        {"ticker": "RTX", "name": "Raytheon Technologies Corporation"},
        {"ticker": "GE", "name": "General Electric Company"},
        {"ticker": "MMM", "name": "3M Company"}
    ]

@app.get("/explore")
def get_explore_stocks():
    file_path = os.path.join(os.path.dirname(__file__), 'top-1000.txt')
    stock_list = []

    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue

                    if '|' in line:
                        parts = line.split('|')
                        ticker = parts[0].strip()
                        name = parts[1].strip()
                    else:
                        ticker = line.strip()
                        name = ticker # Fallback if name not present

                    stock_list.append({"ticker": ticker, "name": name})
        except Exception as e:
            print(f"Error reading top-1000.txt: {e}")
            stock_list = []

    if not stock_list:
        stock_list = get_top_tickers()

    tickers = [item["ticker"] for item in stock_list]
    results = []

    try:
        # Bulk fetch price data
        price_data = fetch_price_data(tickers)

        for item in stock_list:
            ticker_symbol = item["ticker"]
            stock_name = item["name"]

            if ticker_symbol in price_data:
                current_price, previous_close = price_data[ticker_symbol]

                if current_price is not None and previous_close is not None:
                    day_change_usd = current_price - previous_close
                    day_change_percent = (day_change_usd / previous_close) * 100

                    results.append({
                        "ticker": ticker_symbol,
                        "name": stock_name,
                        "currentPrice": round(current_price, 2),
                        "costChange": round(day_change_usd, 2),
                        "percentageChange": round(day_change_percent, 2)
                    })
                else:
                     results.append({
                        "ticker": ticker_symbol,
                        "name": stock_name,
                        "currentPrice": round(current_price, 2) if current_price else None,
                        "costChange": None,
                        "percentageChange": None,
                        "error": "Insufficient price data"
                    })
            else:
                results.append({
                    "ticker": ticker_symbol,
                    "name": stock_name,
                    "currentPrice": None,
                    "costChange": None,
                    "percentageChange": None,
                    "error": "Price data unavailable"
                })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

    return results
