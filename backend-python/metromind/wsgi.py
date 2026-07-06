# metromind/wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'metromind.settings.dev')
application = get_wsgi_application()
