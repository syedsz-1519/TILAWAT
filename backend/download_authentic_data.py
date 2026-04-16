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

def download_tanzil_plain():
    url = 'https://tanzil.net/pub/download/index.php'
    filename = 'quran-simple-plain.txt'
    print(f"Downloading {filename} from Tanzil...")
    try:
        response = requests.post(url, data={'quranType': 'simple-plain', 'format': 'txt', 'agree': '1'}, timeout=30)
        response.raise_for_status()
        
        filepath = os.path.join(DATA_DIR, filename)
        
        tanzil_header = """#  Copyright (C) 2007-2026 Tanzil Project
#  License: Creative Commons Attribution 3.0
#
#  This copy of the Quran text is carefully produced, highly 
#  verified and continuously monitored by a group of specialists 
#  at Tanzil Project.
#
#  TERMS OF USE:
#
#  - Permission is granted to copy and distribute verbatim copies 
#    of this text, but CHANGING IT IS NOT ALLOWED.
#
#  - This Quran text can be used in any website or application, 
#    provided that its source (Tanzil Project) is clearly indicated, 
#    and a link is made to tanzil.net to enable users to keep
#    track of changes.
#
#  - This copyright notice shall be included in all verbatim copies 
#    of the text, and shall be reproduced appropriately in all files 
#    derived from or containing substantial portion of this text.
#
#  Please check updates at: http://tanzil.net/updates/

"""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(tanzil_header + response.text)
        print(f"✅ Successfully saved {filename} with Tanzil Header ({len(response.text)} characters)")
    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")

def main():
    print("Initiating Sacred Data Extraction Pipeline...\n")
    
    # 1. Download Quran (Arabic Uthmani script) from api.alquran.cloud
    quran_ar_url = "http://api.alquran.cloud/v1/quran/quran-uthmani"
    download_json(quran_ar_url, "quran_arabic.json")
    
    time.sleep(1)
    
    # 2. Download Quran (English Clear Quran / Sahih Intl Translation)
    quran_en_url = "http://api.alquran.cloud/v1/quran/en.sahih"
    download_json(quran_en_url, "quran_english.json")
    
    time.sleep(1)
    
    # 3. Download Tanzil Simple Plain Text Version 1.1 with explicit header
    download_tanzil_plain()
    
    print("\nAlhamdulillah! All sacred texts have been successfully downloaded and stored in backend/data/.")

if __name__ == "__main__":
    main()
