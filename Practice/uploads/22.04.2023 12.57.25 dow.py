import requests

i, j = 13, 12
# url = f'https://ia800101.us.archive.org/13/items/23..22/Джеймс%20Кори%20-%20Экспансия-03.%20Врата%20Абаддона%20%28Головин%20К.%29%2F0{i}.%20Врата%20Абаддона.%20Глава%20{j}.mp3'

# Джеймс%20Кори%20-%20Экспансия-03.%20Врата%20Абаддона%20%28Головин%20К.%29%2F11.%20Врата%20Абаддона.%20Глава%2010.mp3
# Джеймс%20Кори%20-%20Экспансия-03.%20Врата%20Абаддона%20%28Головин%20К.%29%2F12.%20Врата%20Абаддона.%20Глава%2011.mp3
# Джеймс%20Кори%20-%20Экспансия-03.%20Врата%20Абаддона%20%28Головин%20К.%29%2F{i}.%20Врата%20Абаддона.%20Глава%20{j}.mp3'

while True:
    url = f'https://ia800101.us.archive.org/13/items/23..22/Джеймс%20Кори%20-%20Экспансия-03.%20Врата%20Абаддона%20%28Головин%20К.%29%2F{i}.%20Врата%20Абаддона.%20Глава%20{j}.mp3'
    req = requests.get(url, stream=True)
    if req.status_code != 200:
        break
    print(url)
    with open(f'Глава_{j}.mp3', 'wb') as file:
        file.write(req.content)
    i += 1
    j += 1

