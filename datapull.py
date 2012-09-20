# Note: this expects python 3

import json
import urllib.request

from pprint import pprint

import pymongo
from pymongo.errors import (DuplicateKeyError,
                            OperationFailure)

c = pymongo.Connection()
db = c.githubdata
coll = db.repos

# github's paging seems to return dupes...
coll.ensure_index([('username', pymongo.ASCENDING),
                   ('name', pymongo.ASCENDING)], unique=True)

page = 0

while True:

    print(page)
    response = urllib.request.urlopen('https://api.github.com/legacy/'
                                      'repos/search/:mongodb?start_page'
                                      '=%d' % (page,))

    data = response.read()
    js = json.loads(data.decode())
    if js['repositories']:
        for repo in js['repositories']:
            try:
                res = coll.update({'username': repo['username'],
                                   'name': repo['name']},
                                  repo, upsert=True, safe=True)
                if not res['updatedExisting']:
                    pprint(repo)
            except (DuplicateKeyError, OperationFailure):
                pass

        page += 1

    else:
        break

