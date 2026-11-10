from supabase import create_client, ClientOptions
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SECRET_KEY")

supabase = None
if url and key:
    supabase = create_client(url, key)
    supabase.postgrest.session = httpx.Client(http2=False)  # force HTTP/1.1