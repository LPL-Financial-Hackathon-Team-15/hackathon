import requests
from datetime import datetime, timedelta
from typing import List, Dict
from services.config import FINNHUB_API_KEY

FINNHUB_COMPANY_NEWS_URL = "https://finnhub.io/api/v1/company-news"
FINNHUB_MARKET_NEWS_URL = "https://finnhub.io/api/v1/news"

async def fetch_company_news(
    ticker: str,
    days: int = 7
) -> List[Dict]:
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)

    params = {
        "symbol": ticker.upper(),
        "from": start_date.isoformat(),
        "to": end_date.isoformat(),
        "token": FINNHUB_API_KEY
    }

    response = requests.get(FINNHUB_COMPANY_NEWS_URL, params=params, timeout=10)
    response.raise_for_status()

    raw_articles = response.json()

    articles = []

    for item in raw_articles:
        # skip empty summaries
        if not item.get("summary"):
            continue

        articles.append({
            "title": item.get("headline"),
            "summary": item.get("summary"),
            "source": item.get("source"),
            "url": item.get("url"),
            "published": datetime.utcfromtimestamp(
                item.get("datetime")
            ).isoformat(),
            "image": item.get("image")
        })

    return articles

async def fetch_market_news(
    category: str,
    days: int = 7
) -> List[Dict]:
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)

    params = {
        "symbol": category.lower(),
        "from": start_date.isoformat(),
        "to": end_date.isoformat(),
        "token": FINNHUB_API_KEY
    }

    response = requests.get(FINNHUB_MARKET_NEWS_URL, params=params, timeout=10)
    response.raise_for_status()

    raw_articles = response.json()

    articles = []

    for item in raw_articles:
        # skip empty summaries
        if not item.get("summary"):
            continue

        articles.append({
            "title": item.get("headline"),
            "summary": item.get("summary"),
            "source": item.get("source"),
            "url": item.get("url"),
            "published": datetime.utcfromtimestamp(
                item.get("datetime")
            ).isoformat(),
            "image": item.get("image")
        })

    return articles
    
