#!/usr/bin/env python3
"""
Quick Test Script for Python Hover Extension
=============================================

Instructions:
1. Open this file in the NEW VS Code window (Extension Development Host)
2. Hover over the import statements below
3. Hover over module names in the usage examples
4. You should see detailed documentation popups with direct links

Expected Results:
- import os → "os — Operating System Interface"
- import sys → "sys — System Parameters"
- import math → "math — Mathematical Functions"
- And 70+ other modules!
"""

import collections
import datetime
import functools
import itertools
import json
import math

# Test basic imports - hover over these!
import os
import pathlib
import random
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

# Test from imports - hover over module names!
from typing import Dict, List, Optional


def test_module_usage():
    """Test function showing module usage - hover over module names!"""

    # File system operations
    current_dir = os.getcwd()  # Hover 'os'
    home_path = pathlib.Path.home()  # Hover 'pathlib'

    # System information
    python_version = sys.version  # Hover 'sys'
    platform_info = sys.platform  # Hover 'sys'

    # Mathematical operations
    pi_value = math.pi  # Hover 'math'
    sqrt_result = math.sqrt(16)  # Hover 'math'

    # Random operations
    random_int = random.randint(1, 100)  # Hover 'random'
    random_choice = random.choice([1, 2, 3])  # Hover 'random'

    # JSON operations
    data = {"test": True}
    json_str = json.dumps(data)  # Hover 'json'
    parsed = json.loads(json_str)  # Hover 'json'

    # Collections
    counter = collections.Counter([1, 1, 2, 3])  # Hover 'collections'
    default_dict = collections.defaultdict(list)  # Hover 'collections'

    # Date/time
    now = datetime.now()  # Hover 'datetime'

    print("All tests complete!")
    print(f"Current directory: {current_dir}")
    print(f"Python version: {python_version}")
    print(f"Random number: {random_int}")




if __name__ == "__main__":
    test_module_usage()
