import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.urlopen('https://sellerverse-api.onrender.com/overview', context=ctx)
# Wait, /overview requires Auth. We need to query DB via another debug endpoint or write a python script and use the `/overview/debug-data` if we can extend it.
# Actually, I'll extend the check_debug.py script or just use a local curl to `/overview/debug-data`? No, I want to fetch dates.

