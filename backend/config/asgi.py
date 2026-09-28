"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

Asynchronous Server Gateway Interface. It is a standard specification that defines how web servers and Python web applications or frameworks communicate.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_asgi_application()
