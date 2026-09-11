"""
api/index.py - Vercel Serverless entry point for AarogyaAI FastAPI backend.
All /api/* requests from Vercel are routed here.
"""
import sys
import os

# Add both repository root and backend directory to sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

for p in [ROOT_DIR, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.main import app

