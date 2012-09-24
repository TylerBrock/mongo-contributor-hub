#!/usr/bin/env python
import json
import os
import urllib2

from datetime import datetime
from pprint import pprint

import pymongo
from pymongo.errors import (DuplicateKeyError,
                            OperationFailure)

uri = os.environ.get('MONGOLAB_URI')

c = pymongo.Connection(uri)
db = c.githubdata
coll = db.repos

# github's paging seems to return dupes...
coll.ensure_index([('username', pymongo.ASCENDING),
                   ('name', pymongo.ASCENDING)], unique=True)

fmt = "%Y-%m-%dT%H:%M:%S"

page = 0

while True:

    #print(page)
    response = urllib2.urlopen('https://api.github.com/legacy/'
        'repos/search/:mongodb?start_page'
        '=%d' % (page,))

    data = response.read()
    js = json.loads(data)
    # github returns an empty array for 'repositories'
    # when there are no more results.
    if js['repositories']:
        for repo in js['repositories']:
            # Convert date strings to real timestamps.
            for field in ('created', 'created_at', 'pushed', 'pushed_at'):
                # TODO: This sucks ass but skip timezone offsets for the time being.
                repo[field] = datetime.strptime(repo[field][:-6], fmt)
            try:
                # Update so we get updated followers and watchers count.
                res = coll.update({'username': repo['username'],
                                   'name': repo['name']},
                                  repo, upsert=True, safe=True)
                if not res['updatedExisting']:
                    pass
            except (DuplicateKeyError, OperationFailure):
                pass

        page += 1

    else:
        break

