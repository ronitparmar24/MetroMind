# metromind/settings/prod.py
from .base import *
from decouple import config

DEBUG = False

# Build allowed hosts from env var, then always add Vercel wildcard domains
# so the env var can't accidentally exclude them.
_configured_hosts = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1'
).split(',')

ALLOWED_HOSTS = list({
    *_configured_hosts,
    '.vercel.app',        # matches metro-mind-twr2.vercel.app and all preview URLs
    'localhost',
    '127.0.0.1',
})

# Tell Django to trust Vercel's reverse-proxy HTTPS headers
# Without this Django treats all incoming requests as HTTP, causing redirect loops
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

CORS_ALLOW_ALL_ORIGINS = False
