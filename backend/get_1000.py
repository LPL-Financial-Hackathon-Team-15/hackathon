import requests
from bs4 import BeautifulSoup
import os

def get_tickers_from_wikipedia(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try finding table by id 'constituents' first (common for S&P pages)
        table = soup.find('table', {'id': 'constituents'})
        
        # If not found, try finding the first sortable wikitable
        if not table:
            table = soup.find('table', {'class': 'wikitable sortable'})
            
        data = []
        if table:
            rows = table.find_all('tr')[1:]  # Skip header
            for row in rows:
                cols = row.find_all('td')
                if cols:
                    # Ticker is usually in the first column
                    ticker = cols[0].text.strip()
                    # Name is usually in the second column
                    name = cols[1].text.strip() if len(cols) > 1 else ticker
                    
                    data.append({"ticker": ticker, "name": name})
        return data
    except Exception as e:
        print(f"Error fetching data from {url}: {e}")
        return []

def get_top_1000():
    # S&P 500 (Large Cap)
    sp500 = get_tickers_from_wikipedia('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies')
    
    # Combine lists
    all_data = sp500
    
    # Remove duplicates if any and take top 250
    unique_data = []
    seen = set()
    for item in all_data:
        t = item["ticker"]
        if t not in seen:
            unique_data.append(item)
            seen.add(t)
            
    top_250 = unique_data[:250]
    
    output_file = os.path.join(os.path.dirname(__file__), 'top-1000.txt')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        for item in top_250:
            f.write(f"{item['ticker']}|{item['name']}\n")
            
    print(f"Saved {len(top_250)} tickers to {output_file}")

if __name__ == "__main__":
    get_top_1000()
