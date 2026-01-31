from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import boto3
import re
import pandas as pd
import yfinance as yf
import json
import sqlite3
from pydantic import BaseModel
import random
from typing import List
from services.finnhub_service import fetch_company_news, fetch_market_news
import os
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import threading


# Bedrock setup - Replace with your actual values after creating guardrail
BEDROCK_REGION = 'us-east-2'  # Or your Bedrock region
MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20240620-v1:0'  # Claude Sonnet (good for summarization)
GUARDRAIL_ID = 'f1mk0d93g9xs'  # From create_guardrail response
GUARDRAIL_VERSION = 'DRAFT'  # Or specific version e.g. 'USD5Z3EXAMPLE'

bedrock_runtime = boto3.client('bedrock-runtime', region_name=BEDROCK_REGION)

# --- Database Setup ---
DB_FILE = "favorites.db"

# Add caching at the top
EXPLORE_CACHE = {
    "data": [],
    "timestamp": None,
    "ttl": 300  # 5 minutes cache
}
# Modify your init_db function to include the explore_stocks table
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Create favorites table with userId
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            ticker TEXT NOT NULL,
            name TEXT NOT NULL,
            UNIQUE(user_id, ticker)
        )
    """)

    # Create explore_stocks table for cached data
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS explore_stocks (
            ticker TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            currentPrice REAL,
            costChange REAL,
            percentageChange REAL,
            last_updated TIMESTAMP
        )
    """)


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

class NewsSummaryRequest(BaseModel):
    ticker: str
    news: List[str]  # List of article texts you provide
    urls: List[str] # List of links for articles provided

class NewsSummaryResponse(BaseModel):
    summary: str
    sources: List[str]
    sentiment: str
    disclaimer: str

class StockAnalysisResponse(BaseModel):
    analysis: str
    sentiment: str
    disclaimer: str

class PinnedStocksOverviewResponse(BaseModel):
    userId: str
    stock_count: int
    overview: str
    sentiment: str
    individual_summaries: List[dict]
    disclaimer: str

# --- Helper Functions ---
def fetch_price_data(tickers):
    """
    Fetches current price and previous close for a list of tickers using yfinance bulk download.
    Returns a dictionary: {ticker: (current_price, previous_close)}
    """
    if not tickers:
        return {}

    if isinstance(tickers, str):
        tickers = [tickers]

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
    def extract_from_df(df, ticker=None):
        if df.empty:
            return None

        # Handle MultiIndex columns (ticker, price_type)
        if isinstance(df.columns, pd.MultiIndex):
            # If ticker is provided, access that column level
            if ticker and (ticker, 'Close') in df.columns:
                closes = df[(ticker, 'Close')].dropna()
            else:
                return None
        else:
            # Regular columns
            if 'Close' not in df.columns:
                return None
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
        # When only one ticker, yfinance still returns MultiIndex with ticker name
        ticker = tickers[0]
        res = extract_from_df(data, ticker=ticker)
        if res:
            results[ticker] = res
    else:
        # MultiIndex columns: top level is Ticker
        for ticker in tickers:
            # Check if ticker is in the columns (it might be missing if download failed)
            if ticker in data.columns.get_level_values(0):
                res = extract_from_df(data[ticker])
                if res:
                    results[ticker] = res

    return results

def summarize_news_with_bedrock(ticker, news_texts, news_urls=None):
    """
    Summarizes news articles using AWS Bedrock Claude model.
    Returns a dict with summary, sentiment, sources, and disclaimer.
    """
    if not news_texts or all(not text.strip() for text in news_texts):
        return {
            "summary": "No news content available to summarize.",
            "sentiment": "neutral",
            "sources": news_urls or [],
            "disclaimer": "Summarized news. Not financial advice."
        }

    # Ensure articles are trimmed to avoid overloading the context
    cleaned_texts = [t[:2000] for t in news_texts[:5] if t and t.strip()]

    if not cleaned_texts:
        return {
            "summary": "No valid news content after processing.",
            "sentiment": "neutral",
            "sources": news_urls or [],
            "disclaimer": "Summarized news. Not financial advice."
        }

    news_content = "\n\n".join(cleaned_texts)

    try:
        # Call Bedrock with improved prompt
        resp = bedrock_runtime.converse(
            modelId=MODEL_ID,
            messages=[{
                "role": "user",
                "content": [{
                    "text": f"""Analyze the following news articles about {ticker} and provide a summary.

News Articles:
{news_content}

Provide your response as a JSON object with exactly two keys:
1. "summary": A concise 2-3 sentence summary of the key facts and developments
2. "sentiment": One of "positive", "negative", or "neutral"

Return ONLY the JSON object, no other text."""
                }]
            }],
            inferenceConfig={
                "maxTokens": 600,
                "temperature": 0.3
            }
        )

        # Extract the response text
        raw_text = resp['output']['message']['content'][0]['text'].strip()
        print(f"--- Bedrock Response for {ticker} ---")
        print(raw_text)
        print("--- End Response ---")

        if not raw_text:
            return {
                "summary": "Model returned empty response.",
                "sentiment": "neutral",
                "sources": news_urls or [],
                "disclaimer": "Summarized news. Not financial advice."
            }

        # Try to parse as JSON
        # First, try to extract JSON from markdown code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find JSON object directly
            json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                # No JSON found, treat entire response as summary
                return {
                    "summary": raw_text[:500],  # Limit length
                    "sentiment": "neutral",
                    "sources": news_urls or [],
                    "disclaimer": "Summarized news. Not financial advice."
                }

        # Parse the JSON
        try:
            data = json.loads(json_str)

            # Validate required keys
            summary = data.get("summary", "").strip()
            sentiment = data.get("sentiment", "neutral").lower()

            # Validate sentiment value
            if sentiment not in ["positive", "negative", "neutral"]:
                sentiment = "neutral"

            if not summary:
                summary = "No summary provided by model."

            return {
                "summary": summary,
                "sentiment": sentiment,
                "sources": news_urls or [],
                "disclaimer": "Summarized news. Not financial advice."
            }

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Attempted to parse: {json_str[:200]}")

            # Fallback: use raw text as summary
            return {
                "summary": raw_text[:500],
                "sentiment": "neutral",
                "sources": news_urls or [],
                "disclaimer": "Summarized news. Not financial advice."
            }

    except Exception as e:
        print(f"Bedrock API Error for {ticker}: {str(e)}")
        import traceback
        traceback.print_exc()

        return {
            "summary": f"Error generating summary: {str(e)[:100]}",
            "sentiment": "error",
            "sources": news_urls or [],
            "disclaimer": "Summarized news. Not financial advice."
        }

def update_explore_stocks():
    """
    Background job that runs periodically to update explore stocks data.
    """
    print(f"[{datetime.now()}] Starting explore stocks update...")

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
                        name = ticker

                    stock_list.append({"ticker": ticker, "name": name})
        except Exception as e:
            print(f"Error reading top-1000.txt: {e}")
            return

    # Process in batches to avoid overwhelming yfinance
    MAX_STOCKS = 200
    if len(stock_list) > MAX_STOCKS:
        stock_list = random.sample(stock_list, MAX_STOCKS)

    tickers = [item["ticker"] for item in stock_list]

    try:
        # Bulk fetch price data
        price_data = fetch_price_data(tickers)

        # Update database
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        current_time = datetime.now()

        for item in stock_list:
            ticker_symbol = item["ticker"]
            stock_name = item["name"]

            if ticker_symbol in price_data:
                current_price, previous_close = price_data[ticker_symbol]

                if current_price is not None and previous_close is not None:
                    day_change_usd = current_price - previous_close
                    day_change_percent = (day_change_usd / previous_close) * 100

                    cursor.execute("""
                        INSERT OR REPLACE INTO explore_stocks
                        (ticker, name, currentPrice, costChange, percentageChange, last_updated)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        ticker_symbol,
                        stock_name,
                        round(current_price, 2),
                        round(day_change_usd, 2),
                        round(day_change_percent, 2),
                        current_time
                    ))

        conn.commit()
        conn.close()

        print(f"[{datetime.now()}] Explore stocks update completed. Updated {len(price_data)} stocks.")

    except Exception as e:
        print(f"Error updating explore stocks: {e}")

# Initialize scheduler
scheduler = BackgroundScheduler()

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    # Run migration first (only needed once)
    migrate_favorites_table()  # Uncomment this line for one-time migration

    init_db()

    # Run initial update
    threading.Thread(target=update_explore_stocks).start()

    # Schedule updates every 10 minutes
    scheduler.add_job(update_explore_stocks, 'interval', minutes=10)
    scheduler.start()

    print("Background scheduler started - explore stocks will update every 10 minutes")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    print("Background scheduler stopped")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add this as a one-time migration function (call it before init_db on first run)
def migrate_favorites_table():
    """
    Migrate existing favorites table to include user_id column.
    This is a one-time migration.
    """
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    try:
        # Check if the old table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='favorites'")
        if cursor.fetchone():
            # Check if user_id column exists
            cursor.execute("PRAGMA table_info(favorites)")
            columns = [column[1] for column in cursor.fetchall()]

            if 'user_id' not in columns:
                print("Migrating favorites table...")

                # Rename old table
                cursor.execute("ALTER TABLE favorites RENAME TO favorites_old")

                # Create new table with user_id
                cursor.execute("""
                               CREATE TABLE favorites
                               (
                                   id      INTEGER PRIMARY KEY AUTOINCREMENT,
                                   user_id TEXT NOT NULL,
                                   ticker  TEXT NOT NULL,
                                   name    TEXT NOT NULL,
                                   UNIQUE (user_id, ticker)
                               )
                               """)

                # Migrate data with a default user_id
                cursor.execute("""
                               INSERT INTO favorites (user_id, ticker, name)
                               SELECT 'default_user', ticker, name
                               FROM favorites_old
                               """)

                # Drop old table
                cursor.execute("DROP TABLE favorites_old")

                conn.commit()
                print("Migration completed successfully!")
            else:
                print("Table already has user_id column, no migration needed.")

    except Exception as e:
        print(f"Migration error: {e}")
        conn.rollback()
    finally:
        conn.close()

@app.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()
    if payload.get("ref") == "refs/heads/main":
        subprocess.run(['git', 'stash'], cwd="/home/ec2-user/hackathon")
        subprocess.run(["git", "pull"], cwd="/home/ec2-user/hackathon")
    return {"status": "ok"}

@app.get("/")
async def read_root():
    ticker = yf.Ticker("AAPL")
    hist = ticker.history(period="5d")
    return {"message": hist.to_dict()}
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
def get_stock_history(ticker: str, period: str = "1mo", interval: str = "1d"):
    try:
        stock = yf.Ticker(ticker)
        
        # Pass both parameters to yfinance
        hist = stock.history(period=period, interval=interval)
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="Stock ticker not found or no data available")
        
        hist.reset_index(inplace=True)
        
        if 'Datetime' in hist.columns:
            hist.rename(columns={'Datetime': 'Date'}, inplace=True)
            hist['Date'] = hist['Date'].dt.strftime('%Y-%m-%d %H:%M')
        else:
            hist['Date'] = hist['Date'].dt.strftime('%Y-%m-%d')
            
        data = hist.to_dict(orient="records")
        
        return {
            "ticker": ticker.upper(),
            "period": period,
            "interval": interval,
            "history": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/pinned/{ticker}/{userId}")
def add_pinned(ticker: str, userId: str):
    """
    Add a stock to user's favorites.

    Parameters:
    - ticker: Stock ticker symbol
    - userId: User identifier
    """
    if not userId or not userId.strip():
        raise HTTPException(status_code=400, detail="userId is required")

    ticker_symbol = ticker.upper()
    user_id = userId.strip()

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
            cursor.execute(
                "INSERT INTO favorites (user_id, ticker, name) VALUES (?, ?, ?)",
                (user_id, ticker_symbol, stock_name)
            )
            conn.commit()
        except sqlite3.IntegrityError:
            # This error occurs if the ticker is already in the database for this user
            conn.close()
            raise HTTPException(
                status_code=409,
                detail=f"Ticker '{ticker_symbol}' is already in favorites for user '{user_id}'."
            )

        conn.close()

        return {
            "message": f"Added '{stock_name} ({ticker_symbol})' to favorites for user '{user_id}'.",
            "userId": user_id,
            "ticker": ticker_symbol,
            "name": stock_name
        }

    except Exception as e:
        # Catch-all for other potential errors (e.g., yfinance exceptions, db connection issues)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/pinned/{userId}")
def get_pinned(userId: str):
    """
    Get all pinned stocks for a specific user.

    Parameters:
    - userId: User identifier (query parameter)

    Returns list of user's favorite stocks with current price data
    """
    if not userId or not userId.strip():
        raise HTTPException(status_code=400, detail="userId is required")

    user_id = userId.strip()

    try:
        # Get favorited tickers from the database for this user
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT ticker, name FROM favorites WHERE user_id = ?",
            (user_id,)
        )
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return []

        # Extract tickers and create lookup
        tickers = [row[0] for row in rows]
        ticker_to_name = {row[0]: row[1] for row in rows}

        # Fetch price data
        price_data = fetch_price_data(tickers)

        # Build response
        favorites_data = []

        for ticker_symbol in tickers:
            stock_name = ticker_to_name[ticker_symbol]

            # Check if we have price data for this ticker
            if ticker_symbol not in price_data:
                favorites_data.append({
                    "ticker": ticker_symbol,
                    "name": stock_name,
                    "currentPrice": None,
                    "costChange": None,
                    "percentageChange": None,
                    "error": "Price data unavailable"
                })
                continue

            # Extract prices
            price_tuple = price_data[ticker_symbol]
            current_price = price_tuple[0]
            previous_close = price_tuple[1]

            # Validate prices exist
            if current_price is None or previous_close is None:
                favorites_data.append({
                    "ticker": ticker_symbol,
                    "name": stock_name,
                    "currentPrice": round(current_price, 2) if current_price is not None else None,
                    "costChange": None,
                    "percentageChange": None,
                    "error": "Insufficient price data"
                })
                continue

            # Calculate changes
            cost_change = current_price - previous_close
            percentage_change = (cost_change / previous_close) * 100

            # Add to results
            favorites_data.append({
                "ticker": ticker_symbol,
                "name": stock_name,
                "currentPrice": round(current_price, 2),
                "costChange": round(cost_change, 2),
                "percentageChange": round(percentage_change, 2)
            })

        return favorites_data

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
@app.delete("/pinned/{ticker}/{userId}")
def delete_pinned(ticker: str, userId: str):
    """
    Remove a stock from user's favorites.

    Parameters:
    - ticker: Stock ticker symbol
    - userId: User identifier (query parameter)
    """
    if not userId or not userId.strip():
        raise HTTPException(status_code=400, detail="userId is required")

    ticker_symbol = ticker.upper()
    user_id = userId.strip()

    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Check if ticker exists for this user
        cursor.execute(
            "SELECT ticker FROM favorites WHERE user_id = ? AND ticker = ?",
            (user_id, ticker_symbol)
        )
        if cursor.fetchone() is None:
            conn.close()
            raise HTTPException(
                status_code=404,
                detail=f"Ticker '{ticker_symbol}' not found in favorites for user '{user_id}'."
            )

        cursor.execute(
            "DELETE FROM favorites WHERE user_id = ? AND ticker = ?",
            (user_id, ticker_symbol)
        )
        conn.commit()
        conn.close()

        return {
            "message": f"Removed '{ticker_symbol}' from favorites for user '{user_id}'.",
            "userId": user_id,
            "ticker": ticker_symbol
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/explore")
def get_explore_stocks(limit: int = 100, offset: int = 0):
    """
    Get explore stocks from cached database.
    Much faster than fetching from yfinance every time.
    """
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Get total count
        cursor.execute("SELECT COUNT(*) FROM explore_stocks")
        total_count = cursor.fetchone()[0]

        # Get paginated results
        cursor.execute("""
            SELECT ticker, name, currentPrice, costChange, percentageChange, last_updated
            FROM explore_stocks
            ORDER BY currentPrice DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))

        rows = cursor.fetchall()
        conn.close()

        results = []
        for row in rows:
            results.append({
                "ticker": row[0],
                "name": row[1],
                "currentPrice": row[2],
                "costChange": row[3],
                "percentageChange": row[4],
                "last_updated": row[5]
            })

        return {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "stocks": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/summarize-news/{ticker}", response_model=dict)
async def get_summarized_news(ticker: str, period: int = 7):
    news = get_company_news(ticker, period)
    articles = news.get("articles", [])
    
    if not articles:
        return {
            "summary": "No recent news found for this ticker.",
            "sources": [],
            "sentiment": "neutral",
            "disclaimer": "No data available."
        }

    news_texts = []
    news_urls = []
    
    for article in articles:
        # Handle both dicts and objects (Pydantic models)
        if isinstance(article, dict):
            news_texts.append(article.get("summary", "") or "")
            news_urls.append(article.get("url", "") or "")
        else:
            news_texts.append(getattr(article, "summary", "") or "")
            news_urls.append(getattr(article, "url", "") or "")
            
    summary_request = NewsSummaryRequest(ticker=ticker, news=news_texts, urls=news_urls)
    result = await summarize_news(summary_request)
    if result is None:
        return {
            "summary": "Summary unavailable.",
            "sources": [],
            "sentiment": "neutral",
            "disclaimer": "Error processing request."
        }
    return result

async def summarize_news(request: NewsSummaryRequest):
    """
    Changed to 'async def' so it can be awaited by the endpoint.
    """
    try:
        # Since summarize_news_with_bedrock is a blocking I/O call (boto3),
        # we just call it normally here.
        return summarize_news_with_bedrock(request.ticker, request.news, request.urls)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization error: {str(e)}")

# Update the helper function
def analyze_stock_performance(ticker, period="1y"):
    """
    Analyzes historical stock performance using price data and AWS Bedrock.
    Returns analysis, sentiment, and disclaimer.
    """
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)

        if hist.empty:
            return {
                "analysis": f"No historical data available for {ticker} over the {period} period.",
                "sentiment": "neutral",
                "disclaimer": "Unable to perform analysis due to lack of data."
            }

        # Calculate key metrics
        current_price = float(hist['Close'].iloc[-1])
        start_price = float(hist['Close'].iloc[0])
        high_price = float(hist['High'].max())
        low_price = float(hist['Low'].min())
        avg_volume = float(hist['Volume'].mean())

        total_return = ((current_price - start_price) / start_price) * 100
        volatility = float(hist['Close'].pct_change().std() * 100)

        # Calculate moving averages if enough data
        if len(hist) >= 50:
            ma_50 = float(hist['Close'].rolling(window=50).mean().iloc[-1])
        else:
            ma_50 = None

        if len(hist) >= 200:
            ma_200 = float(hist['Close'].rolling(window=200).mean().iloc[-1])
        else:
            ma_200 = None

        # Prepare data summary for Bedrock
        data_summary = f"""
Ticker: {ticker}
Period: {period}
Current Price: ${current_price:.2f}
Starting Price: ${start_price:.2f}
Total Return: {total_return:.2f}%
High Price: ${high_price:.2f}
Low Price: ${low_price:.2f}
Price Volatility: {volatility:.2f}%
Average Daily Volume: {avg_volume:,.0f}
"""

        if ma_50:
            data_summary += f"50-Day Moving Average: ${ma_50:.2f}\n"
        if ma_200:
            data_summary += f"200-Day Moving Average: ${ma_200:.2f}\n"

        # Call Bedrock for analysis
        try:
            resp = bedrock_runtime.converse(
                modelId=MODEL_ID,
                messages=[{
                    "role": "user",
                    "content": [{
                        "text": f"""Analyze the following historical stock performance data for {ticker}:

{data_summary}

Provide your response as a JSON object with exactly two keys:
1. "analysis": A comprehensive 4-5 sentence analysis covering:
   - Overall performance and total return over the period
   - Volatility assessment and what it means
   - Technical indicators (moving averages if available)
   - Key patterns or trends observed
   - Notable price levels (highs/lows)

2. "sentiment": One of "bullish", "bearish", or "neutral" based on the technical indicators and performance

Be specific with numbers and percentages. Write in clear, professional language.
Return ONLY the JSON object, no other text."""
                    }]
                }],
                inferenceConfig={
                    "maxTokens": 1000,
                    "temperature": 0.3
                }
            )

            raw_text = resp['output']['message']['content'][0]['text'].strip()
            print(f"--- Bedrock Analysis Response for {ticker} ---")
            print(raw_text)
            print("--- End Response ---")

            if not raw_text:
                return {
                    "analysis": "Model returned empty response.",
                    "sentiment": "neutral",
                    "disclaimer": "This is automated analysis based on historical data. Not financial advice."
                }

            # Extract JSON from response
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    # No JSON found, use raw text as analysis
                    return {
                        "analysis": raw_text[:1000],
                        "sentiment": "neutral",
                        "disclaimer": "This is automated analysis based on historical data. Not financial advice."
                    }

            # Parse JSON
            import json as json_module
            data = json_module.loads(json_str)

            analysis_text = data.get("analysis", "").strip()
            sentiment = data.get("sentiment", "neutral").lower()

            # Validate sentiment
            if sentiment not in ["bullish", "bearish", "neutral"]:
                sentiment = "neutral"

            if not analysis_text:
                analysis_text = "No analysis provided by model."

            return {
                "analysis": analysis_text,
                "sentiment": sentiment,
                "disclaimer": "This is automated analysis based on historical data. Not financial advice."
            }

        except Exception as bedrock_error:
            print(f"Bedrock error: {bedrock_error}")
            import traceback
            traceback.print_exc()

            # Return basic analysis if Bedrock fails
            basic_analysis = f"Over the {period} period, {ticker} "
            if total_return > 0:
                basic_analysis += f"has gained {total_return:.2f}%, "
            else:
                basic_analysis += f"has declined {abs(total_return):.2f}%, "

            basic_analysis += f"moving from ${start_price:.2f} to ${current_price:.2f}. "
            basic_analysis += f"The stock reached a high of ${high_price:.2f} and a low of ${low_price:.2f} during this period. "
            basic_analysis += f"Price volatility measured at {volatility:.2f}%, "

            if volatility < 2:
                basic_analysis += "indicating relatively stable price movements."
            elif volatility < 4:
                basic_analysis += "showing moderate price fluctuations."
            else:
                basic_analysis += "reflecting significant price swings."

            basic_sentiment = "bullish" if total_return > 5 else ("bearish" if total_return < -5 else "neutral")

            return {
                "analysis": basic_analysis,
                "sentiment": basic_sentiment,
                "disclaimer": "Basic analysis only. AI-powered analysis unavailable. Not financial advice."
            }

    except Exception as e:
        print(f"Stock analysis error for {ticker}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error analyzing stock: {str(e)}")


# Update the endpoint
@app.get("/analyze/{ticker}", response_model=StockAnalysisResponse)
async def analyze_stock(ticker: str, period: str = "1y"):
    """
    Analyze historical stock performance.

    Parameters:
    - ticker: Stock ticker symbol (e.g., AAPL, TSLA)
    - period: Time period for analysis (default: 1y)
              Valid periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max

    Returns:
    - analysis: Comprehensive analysis of stock performance
    - sentiment: Overall sentiment (bullish, bearish, or neutral)
    - disclaimer: Legal disclaimer about the analysis
    """
    valid_periods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']

    if period not in valid_periods:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid period. Must be one of: {', '.join(valid_periods)}"
        )

    try:
        result = analyze_stock_performance(ticker.upper(), period)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# Add this helper function
def generate_pinned_stocks_overview(userId: str, days: int = 7):
    """
    Generates an overview of all pinned stocks including news analysis.
    Returns overview, sentiment, and individual stock summaries.
    """
    try:
        # 1. Get user's pinned stocks
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT ticker, name FROM favorites WHERE user_id = ?",
            (userId,)
        )
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return {
                "userId": userId,
                "stock_count": 0,
                "overview": "No pinned stocks found for this user.",
                "sentiment": "neutral",
                "individual_summaries": [],
                "disclaimer": "No data available."
            }

        # 2. Collect news and summaries for each stock
        individual_summaries = []
        all_news_combined = []

        for ticker, name in rows:
            try:
                # Get news for this ticker
                news_response = get_company_news(ticker, days)
                articles = news_response.get("articles", [])

                if not articles:
                    individual_summaries.append({
                        "ticker": ticker,
                        "name": name,
                        "summary": "No recent news available.",
                        "sentiment": "neutral",
                        "article_count": 0
                    })
                    continue

                articles = articles[:5]

                # Extract news texts and URLs
                news_texts = []
                news_urls = []
                for article in articles:
                    if isinstance(article, dict):
                        news_texts.append(article.get("summary", "") or "")
                        news_urls.append(article.get("url", "") or "")
                    else:
                        news_texts.append(getattr(article, "summary", "") or "")
                        news_urls.append(getattr(article, "url", "") or "")

                # Get summary for this individual stock
                stock_summary = summarize_news_with_bedrock(ticker, news_texts, news_urls)

                individual_summaries.append({
                    "ticker": ticker,
                    "name": name,
                    "summary": stock_summary.get("summary", "No summary available."),
                    "sentiment": stock_summary.get("sentiment", "neutral"),
                    "article_count": len(articles),
                    "sources": stock_summary.get("sources", [])
                })

                # Combine for overall analysis
                combined_text = f"{ticker} ({name}): {stock_summary.get('summary', '')}"
                all_news_combined.append(combined_text)

            except Exception as e:
                print(f"Error processing {ticker}: {e}")
                individual_summaries.append({
                    "ticker": ticker,
                    "name": name,
                    "summary": f"Error retrieving news: {str(e)[:100]}",
                    "sentiment": "neutral",
                    "article_count": 0
                })

        # 3. Generate overall portfolio overview using Bedrock
        if not all_news_combined:
            return {
                "userId": userId,
                "stock_count": len(rows),
                "overview": "Unable to generate overview due to lack of news data.",
                "sentiment": "neutral",
                "individual_summaries": individual_summaries,
                "disclaimer": "This is automated analysis. Not financial advice."
            }

        portfolio_context = "\n\n".join(all_news_combined)

        try:
            resp = bedrock_runtime.converse(
                modelId=MODEL_ID,
                messages=[{
                    "role": "user",
                    "content": [{
                        "text": f"""Analyze the following portfolio of {len(rows)} stocks and their recent news summaries:

{portfolio_context}

Provide your response as a JSON object with exactly two keys:
1. "overview": A comprehensive 4-5 sentence overview of the entire portfolio covering:
   - Overall market sentiment across the stocks
   - Common themes or trends
   - Notable individual stock performances
   - Portfolio-level risks or opportunities

2. "sentiment": Overall portfolio sentiment - one of "bullish", "bearish", or "neutral"

Be specific and reference individual stocks where relevant.
Return ONLY the JSON object, no other text."""
                    }]
                }],
                inferenceConfig={
                    "maxTokens": 1000,
                    "temperature": 0.3
                }
            )

            raw_text = resp['output']['message']['content'][0]['text'].strip()
            print(f"--- Portfolio Overview Response ---")
            print(raw_text)
            print("--- End Response ---")

            if not raw_text:
                return {
                    "userId": userId,
                    "stock_count": len(rows),
                    "overview": "Model returned empty response.",
                    "sentiment": "neutral",
                    "individual_summaries": individual_summaries,
                    "disclaimer": "This is automated analysis. Not financial advice."
                }

            # Extract JSON from response
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    # No JSON found, use raw text as overview
                    return {
                        "userId": userId,
                        "stock_count": len(rows),
                        "overview": raw_text[:1000],
                        "sentiment": "neutral",
                        "individual_summaries": individual_summaries,
                        "disclaimer": "This is automated analysis. Not financial advice."
                    }

            # Parse JSON
            import json as json_module
            data = json_module.loads(json_str)

            overview_text = data.get("overview", "").strip()
            sentiment = data.get("sentiment", "neutral").lower()

            # Validate sentiment
            if sentiment not in ["bullish", "bearish", "neutral"]:
                sentiment = "neutral"

            if not overview_text:
                overview_text = "No overview provided by model."

            return {
                "userId": userId,
                "stock_count": len(rows),
                "overview": overview_text,
                "sentiment": sentiment,
                "individual_summaries": individual_summaries,
                "disclaimer": "This is automated analysis based on recent news. Not financial advice."
            }

        except Exception as bedrock_error:
            print(f"Bedrock error for portfolio overview: {bedrock_error}")
            import traceback
            traceback.print_exc()

            # Fallback to basic overview
            stock_names = [name for _, name in rows]
            basic_overview = f"Portfolio contains {len(rows)} stocks: {', '.join(stock_names)}. "

            # Count sentiments
            sentiments = [s.get("sentiment", "neutral") for s in individual_summaries]
            bullish_count = sentiments.count("positive") + sentiments.count("bullish")
            bearish_count = sentiments.count("negative") + sentiments.count("bearish")

            if bullish_count > bearish_count:
                basic_overview += f"Overall sentiment is positive with {bullish_count} stocks showing bullish indicators."
                portfolio_sentiment = "bullish"
            elif bearish_count > bullish_count:
                basic_overview += f"Overall sentiment is negative with {bearish_count} stocks showing bearish indicators."
                portfolio_sentiment = "bearish"
            else:
                basic_overview += "Overall sentiment is mixed across the portfolio."
                portfolio_sentiment = "neutral"

            return {
                "userId": userId,
                "stock_count": len(rows),
                "overview": basic_overview,
                "sentiment": portfolio_sentiment,
                "individual_summaries": individual_summaries,
                "disclaimer": "Basic analysis only. AI-powered overview unavailable. Not financial advice."
            }

    except Exception as e:
        print(f"Error generating portfolio overview: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating overview: {str(e)}")


# Add this endpoint
@app.get("/pinned/overview/{userId}", response_model=PinnedStocksOverviewResponse)
async def get_pinned_stocks_overview(userId: str, days: int = 7):
    """
    Get a comprehensive overview of all pinned stocks including news analysis.

    Parameters:
    - userId: User identifier (query parameter)
    - days: Number of days to look back for news (default: 7)

    Returns:
    - userId: The user ID
    - stock_count: Number of pinned stocks
    - overview: AI-generated portfolio overview
    - sentiment: Overall portfolio sentiment (bullish/bearish/neutral)
    - individual_summaries: List of summaries for each stock
    - disclaimer: Legal disclaimer
    """
    if not userId or not userId.strip():
        raise HTTPException(status_code=400, detail="userId is required")

    if days < 1 or days > 30:
        raise HTTPException(status_code=400, detail="days must be between 1 and 30")

    try:
        result = generate_pinned_stocks_overview(userId.strip(), days)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Overview generation failed: {str(e)}")