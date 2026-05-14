from supabase import create_client, Client
from backend.shared.config import settings

def get_supabase() -> Client:
    """Returns a Supabase client using the service key for administrative tasks."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

supabase: Client = get_supabase()
