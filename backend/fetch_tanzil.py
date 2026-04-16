import requests
import re
from bs4 import BeautifulSoup

def main():
    session = requests.Session()
    url = "https://tanzil.net/download/"
    print(f"Fetching {url}")
    res = session.get(url)
    
    # Let's see what the form looks like
    print("Form action URL:", re.findall(r'action="/([^"]+)"', res.text))
    # Let's extract select options for "quranType"
    types = re.findall(r'<option[^>]*value="([^"]+)"[^>]*>([^<]+)</option>', res.text)
    print("Available options for Quran Type:", len(types))
    for v, t in types:
        if 'simple' in v.lower() or 'plain' in v.lower():
            print(f"Found match: {v} -> {t}")

    # To download, we post to the action URL
    # Params: quranType=simple-plain?, format=txt?, agree=on?

if __name__ == "__main__":
    main()
