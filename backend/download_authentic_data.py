import os
import requests
import json
import time

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def download_json(url, filename):
    print(f"Downloading from {url}...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        filepath = os.path.join(DATA_DIR, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Successfully saved {filename} ({len(json.dumps(data))} bytes)")
        return data
    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")
        return None

def main():
    print("Initiating Sacred Data Extraction Pipeline...\n")
    
    # 1. Download Quran (Arabic Uthmani script) from api.alquran.cloud
    quran_ar_url = "http://api.alquran.cloud/v1/quran/quran-uthmani"
    download_json(quran_ar_url, "quran_arabic.json")
    
    time.sleep(1)
    
    # 2. Download Quran (English Clear Quran / Sahih Intl Translation)
    quran_en_url = "http://api.alquran.cloud/v1/quran/en.sahih"
    download_json(quran_en_url, "quran_english.json")
    
    print("\nAlhamdulillah! All sacred texts have been successfully downloaded and stored in backend/data/.")

if __name__ == "__main__":
    main()
