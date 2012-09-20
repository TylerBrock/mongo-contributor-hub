# Note: this expects python 3

import json
import urllib.request

import pymongo

c = pymongo.Connection()
db = c.githubdata
coll = db.repos

page = 0

while True:

    response = urllib.request.urlopen('https://api.github.com/legacy/repos/search/:mongodb?start_page=%d' % page)

    data = response.read()
    js = json.loads(data.decode())
    if len(js['repositories']):
        for repo in js['repositories']:
            coll.insert(repo)
        page += 1
        print(page)

    else:
        break


