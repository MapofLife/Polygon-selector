
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
        sql = "insert into save_geom_test \
        select new_new_name as geom_name, the_geom \
        from wdpa2010 \
        where cartodb_id = " + cartodb_id
        logging.info(sql)
        url = 'http://mol.cartodb.com/api/v2/sql?%s' % (urllib.urlencode(dict(q=sql, api_key=api_key)))
        logging.info(url)
        value = urlfetch.fetch(url, deadline=60).content
        self.response.headers["Cache-Control"] = "max-age=2629743" # Cache 1 month
        self.response.headers["Content-Type"] = "application/json"
        self.response.out.write(value)

application = webapp2.WSGIApplication(
    [('/save/put', PutHandler),],
    debug=True)
def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()