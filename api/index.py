import os
import sys

# Ensure project root is in search path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.append(root_dir)

# Import the production FastAPI app
from server import app
