import os
import sys

# Ensure root workspace and backend package are in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# On Vercel Serverless environment, filesystem is read-only except /tmp
if os.environ.get("VERCEL"):
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:////tmp/kisan_dost.db"

from backend.app.main import app
