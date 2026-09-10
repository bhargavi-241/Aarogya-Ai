"""
api/index.py - Vercel Serverless entry point for AarogyaAI FastAPI backend.
All /api/* requests from Vercel are routed here.
"""
import sys
import os

# Add the project root so we can import from backend/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app.main import app
