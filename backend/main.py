from fastapi import FastAPI, Request, HTTPException
import subprocess
import yfinance as yf
import sqlite3
from pydantic import BaseModel

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

# --- FastAPI App ---
app = FastAPI()

@app.on_event("startup")
async def startup_event():
    init_db()

@app.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()
    if payload.get("ref") == "refs/heads/main":
        subprocess.run(["git", "pull"], cwd="/home/ec2-user/hackathon")
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"message": "Server running right now"}

@app.get("/stock/{ticker}")
def get_stock_history(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1mo")
        
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
        
        # 2. Loop through each ticker to get current price and day change
        for row in rows:
            ticker_symbol = row[0]
            stock_name = row[1]
            
            try:
                stock = yf.Ticker(ticker_symbol)
                # Use fast_info for faster retrieval of current price and previous close
                current_price = stock.fast_info.last_price
                previous_close = stock.fast_info.previous_close
                
                if current_price is None or previous_close is None:
                     # Fallback to .info if fast_info fails or returns None
                    info = stock.info
                    current_price = info.get('currentPrice') or info.get('regularMarketPrice')
                    previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose')

                if current_price and previous_close:
                    day_change_usd = current_price - previous_close
                    day_change_percent = (day_change_usd / previous_close) * 100
                    
                    favorites_data.append({
                        "ticker": ticker_symbol,
                        "name": stock_name,
                        "currentPrice": round(current_price, 2),
                        "costChange": round(day_change_usd, 2),
                        "percentageChange": round(day_change_percent, 2)
                    })
                else:
                     # Handle case where price data is unavailable
                    favorites_data.append({
                        "ticker": ticker_symbol,
                        "name": stock_name,
                        "currentPrice": None,
                        "costChange": None,
                        "percentageChange": None,
                        "error": "Price data unavailable"
                    })

            except Exception as e:
                print(f"Error fetching data for {ticker_symbol}: {e}")
                favorites_data.append({
                    "ticker": ticker_symbol,
                    "name": stock_name,
                    "currentPrice": None,
                    "costChange": None,
                    "percentageChange": None,
                    "error": "Error fetching data"
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
