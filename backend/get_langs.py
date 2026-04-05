import urllib.request, json
url = 'https://api.quran.com/api/v4/resources/translations'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req).read()
data = json.loads(res.decode('utf-8'))
langs = ['hindi', 'urdu', 'telugu', 'marathi', 'tamil', 'gujarati', 'malayalam', 'kannada', 'assamese', 'odia', 'bengali', 'kashmiri']
out = {}
names = {}
for t in data['translations']:
    lang = t['language_name'].lower()
    if lang in langs and lang not in out:
        out[lang] = t['id']
        names[lang] = t['name']
print("IDS:", ','.join([str(x) for x in out.values()]))
print("MAP:", json.dumps(out))
print("NAMES:", json.dumps(names))
