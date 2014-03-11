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
        url = 'https://mol.cartodb.com/api/v1/imports/?api_key='+api_key
        form_fields = {
        "first_name": "Albert",
        "last_name": "Johnson",
        "email_address": "Albert.Johnson@example.com"
        }
        form_data = urllib.urlencode(form_fields)
        result = urlfetch.fetch(url=url,
            payload=form_data,
            method=urlfetch.POST,
            headers={'Content-Type': 'application/x-www-form-urlencoded', 'Content-Disposition': 'form-data; filename="hello.json"'})
        logging.info(result)
application = webapp2.WSGIApplication(
    [('/save/put', PutHandler),],
    debug=True)
def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()