
"""This module contains a handler that pushes geometries to a save table."""

__author__ = 'Mil'

# MOL imports

# Standard Python imports
import json
import logging
import urllib
import webapp2
import email.mime.application

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
        form_data = email.mime.application.MIMEApplication(open("testtable.txt","rb").read())
        form_data['Content-Disposition'] = 'form-data; name = "something"; filename = "hello.csv"'
        result = urlfetch.fetch(url=url,
            payload=form_data.as_string(),
            method=urlfetch.POST,
            headers={'Content-Type': 'application/x-www-form-urlencoded'})
application = webapp2.WSGIApplication(
    [('/save/put', PutHandler),],
    debug=True)
def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()