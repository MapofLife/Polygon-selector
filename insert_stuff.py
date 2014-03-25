
"""This module contains a handler that pushes geometries to a save table."""

__author__ = 'Mil'

# MOL imports

# Standard Python imports
import json
import logging
import urllib
import webapp2

# Google App Engine imports
from google.appengine.api import urlfetch
from google.appengine.ext.webapp.util import run_wsgi_app

api_key = ''

class PutHandler(webapp2.RequestHandler):
    """Request handler for cache requests."""
    def post(self):
        cartodb_id = self.request.get('cartodb_id')
        shape_name = self.request.get('shape_name')
        table_name = self.request.get('table_name')
        new_table = self.request.get('new_table')
        # pass in name, table, newtable name, and insert
        sql = "insert into "+new_table+" (geom_name, the_geom_webmercator) \
        values ('"+shape_name+"', (select the_geom_webmercator \
        from "+table_name+" \
        where cartodb_id = "+cartodb_id+"))"
        logging.info(sql)
        url = 'http://mol.cartodb.com/api/v2/sql?%s' % (urllib.urlencode(dict(q=sql, api_key=api_key)))
        logging.info(url)
        value = urlfetch.fetch(url, deadline=60).content
        self.response.headers["Cache-Control"] = "max-age=2629743" # Cache 1 month
        self.response.headers["Content-Type"] = "application/json"
        self.response.out.write(value)

class CreateHandler(webapp2.RequestHandler):
    """Request handler for cache requests."""
    def post(self):
        table_name = self.request.get('table_name')
        sql = "create table "+table_name+" (geom_name varchar(255), the_geom_webmercator geometry)"
        url = 'http://mol.cartodb.com/api/v2/sql?%s' % (urllib.urlencode(dict(q=sql, api_key=api_key)))
        value = urlfetch.fetch(url, deadline=60).content
        logging.info(sql)
        self.response.headers["Cache-Control"] = "max-age=2629743" # Cache 1 month
        self.response.headers["Content-Type"] = "application/json"
        self.response.out.write(value) 

application = webapp2.WSGIApplication(
    [('/save/create', CreateHandler), ('/save/put', PutHandler)],
    debug=True)
def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()