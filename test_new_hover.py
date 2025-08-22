# Test the new prominent module hover
import json
import math
import os
import sys

# Try hovering over these module names:
# 1. Hover over "os" in the import above
# 2. Hover over "os" in the usage below
# 3. Compare the different hover styles

current_dir = os.getcwd()
version = sys.version
pi_value = math.pi
data = json.dumps({"test": "module hover"})
