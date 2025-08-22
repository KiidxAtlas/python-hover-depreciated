# Comprehensive Module Hover Test
# Test the new prominent module hover vs regular hover

import asyncio  # Asynchronous I/O
import base64  # Base64 Data Encodings
import collections  # 🐍 Container Data Types + Quick Ref: Counter(), defaultdict(), etc.
import csv  # CSV File Reading/Writing
import datetime  # 🐍 Date & Time Handling + Quick Ref: now(), date(), etc.
import glob  # Unix Style Pathname Pattern Expansion
import gzip  # Support for Gzip Files
import hashlib  # Secure Hash & Message Digest
import http  # HTTP Modules
import io  # Core Tools for Streams
import itertools  # 🐍 Iterator Functions + Quick Ref: chain(), combinations(), etc.
import json  # 🐍 JSON Encoder/Decoder + Quick Ref: loads(), dumps(), etc.
import logging  # Logging Facility
import math  # 🐍 Mathematical Functions + Quick Ref: pi, sqrt(), sin(), etc.

# ====================================================================
# TEST THESE IMPORT STATEMENTS (should show NEW prominent hover)
# ====================================================================
import os  # 🐍 Operating System Interface + Quick Ref: getcwd(), listdir(), etc.
import pathlib  # 🐍 Object-oriented Filesystem Paths + Quick Ref: Path(), exists(), etc.
import pickle  # Python Object Serialization
import random  # 🐍 Random Number Generation + Quick Ref: randint(), choice(), etc.
import re  # 🐍 Regular Expression Operations + Quick Ref: search(), match(), etc.
import secrets  # Cryptographically Strong Random Numbers
import shutil  # High-level File Operations
import sqlite3  # SQLite Database Interface
import subprocess  # Subprocess Management
import sys  # 🐍 System Parameters + Quick Ref: argv, version, path, etc.
import tempfile  # Generate Temporary Files
import threading  # Thread-based Parallelism
import typing  # Type Hints Support
import unittest  # Unit Testing Framework

# More modules to test
import urllib  # URL Handling Modules
import xml  # XML Processing Modules
import zipfile  # Work with ZIP Archives

# ====================================================================
# TEST THESE MODULE USAGES (should show REGULAR combined hover)
# ====================================================================

# File operations
current_dir = os.getcwd()  # Should show: built-in hover + our extension
files = os.listdir(".")  # Should show: built-in hover + our extension
home = pathlib.Path.home()  # Should show: built-in hover + our extension

# System info
python_version = sys.version  # Should show: built-in hover + our extension
platform = sys.platform  # Should show: built-in hover + our extension
args = sys.argv  # Should show: built-in hover + our extension

# Math operations
pi = math.pi  # Should show: built-in hover + our extension
sqrt_val = math.sqrt(16)  # Should show: built-in hover + our extension
sin_val = math.sin(math.pi / 2)  # Should show: built-in hover + our extension

# JSON operations
data = {"test": True}
json_str = json.dumps(data)  # Should show: built-in hover + our extension
parsed = json.loads(json_str)  # Should show: built-in hover + our extension

# Random operations
rand_int = random.randint(1, 100)  # Should show: built-in hover + our extension
choice = random.choice([1, 2, 3])  # Should show: built-in hover + our extension

print("Test complete!")
print("✅ Import hovers should be clean and prominent")
print("✅ Usage hovers should show combined information")
