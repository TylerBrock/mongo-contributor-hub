#!/usr/bin/env ruby
require 'mongo'
require 'rest_client'
require 'json'

# Setup Mongo
conn = Mongo::Connection.new
db = conn['hub']
collection = db['repos']

# Clear out old collection
collection.remove

GH_API = 'https://api.github.com/'
SEARCH = 'legacy/repos/search/'

SEARCH_RESOURCE = GH_API + SEARCH + 'mongodb'

page = 0

loop do
  puts "Processing page #{page}"
  url = SEARCH_RESOURCE + "?start_page=#{page}" 
  result = RestClient.get url, {:accept => :json}
  rh = JSON.load(result)
  if rh['repositories'].length > 0
    collection.insert(rh['repositories'])
    page += 1
  else
    break
  end
end
