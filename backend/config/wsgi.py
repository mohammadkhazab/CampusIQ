"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

WSGI (Web Server Gateway Interface) is a standard rulebook that lets web servers talk to Python web applications.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()
