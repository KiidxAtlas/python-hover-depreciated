# Demo: Comprehensive Built-in Module Support
#
# This file demonstrates the enhanced Python hover extension
# with comprehensive built-in module mapping support.
#
# Instructions:
# 1. Hover over any import statement below
# 2. Hover over module names in the code
# 3. You should see detailed documentation with direct links to Python docs
#
# Key Features:
# - 70+ built-in Python modules supported
# - Direct links to official Python documentation
# - Hover support for import statements
# - Module-specific anchors for precise navigation

import array  # Efficient Arrays of Numeric Values
import asyncio  # Asynchronous I/O
import base64  # Base16, Base32, Base64, Base85 Data Encodings
import bisect  # Array Bisection Algorithm
import codecs  # Codec Registry and Base Classes

# ============================================================================
# DATA STRUCTURES & ALGORITHMS
# ============================================================================
import collections  # Container Data Types
import cProfile  # C Extension Profiling
import csv  # CSV File Reading and Writing
import dataclasses  # Data Classes
import email  # Email Handling Package
import enum  # Support for Enumerations
import functools  # Higher-order Functions and Operations
import glob  # Unix Style Pathname Pattern Expansion
import gzip  # Support for Gzip Files

# ============================================================================
# SECURITY & ENCODING
# ============================================================================
import hashlib  # Secure Hashes and Message Digests
import heapq  # Heap Queue Algorithm
import http  # HTTP Modules
import inspect  # Inspect Live Objects
import io  # Core Tools for Working with Streams
import itertools  # Iterator Functions

# ============================================================================
# TEXT & DATA PROCESSING
# ============================================================================
import json  # JSON Encoder and Decoder

# ============================================================================
# DEBUGGING & PROFILING
# ============================================================================
import logging  # Logging Facility for Python
import math  # Mathematical Functions
import multiprocessing  # Process-based Parallelism

# ============================================================================
# BASIC MODULES - Essential Python modules
# ============================================================================
import os  # Operating System Interface

# ============================================================================
# FILE & PATH OPERATIONS
# ============================================================================
import pathlib  # Object-oriented Filesystem Paths
import pdb  # The Python Debugger

# ============================================================================
# SERIALIZATION & COMPRESSION
# ============================================================================
import pickle  # Python Object Serialization
import profile  # Python Profiler
import queue  # A Synchronized Queue Class
import random  # Generate Random Numbers
import re  # Regular Expression Operations
import secrets  # Generate Secure Random Numbers
import shutil  # High-level File Operations
import smtplib  # SMTP Protocol Client
import socket  # Low-level Networking Interface
import string  # Common String Operations
import subprocess  # Subprocess Management
import sys  # System Parameters and Functions
import tarfile  # Read and Write tar Archive Files
import tempfile  # Generate Temporary Files and Directories
import textwrap  # Text Wrapping and Filling

# ============================================================================
# CONCURRENCY & PARALLELISM
# ============================================================================
import threading  # Thread-based Parallelism
import time  # Time Access and Conversions
import timeit  # Measure Execution Time of Small Code Snippets

# ============================================================================
# TYPE SYSTEM & DEVELOPMENT
# ============================================================================
import typing  # Support for Type Hints
import unittest  # Unit Testing Framework

# ============================================================================
# NETWORKING & WEB
# ============================================================================
import urllib  # URL Handling Modules
import xml  # XML Processing Modules
import zipfile  # Work with ZIP Archives

# ============================================================================
# USAGE EXAMPLES - Hover over module names in these examples
# ============================================================================

# File operations with pathlib
current_dir = pathlib.Path.cwd()
files = list(current_dir.glob("*.py"))

# JSON processing
data = {"name": "Python", "version": "3.9"}
json_string = json.dumps(data, indent=2)
parsed_data = json.loads(json_string)

# Mathematical operations
angle = math.pi / 4
sine_value = math.sin(angle)
random_number = random.randint(1, 100)

# System information
python_version = sys.version
platform = sys.platform
current_path = os.getcwd()

# Regular expressions
pattern = re.compile(r"\d{4}-\d{2}-\d{2}")
match = pattern.search("Today is 2024-01-15")

# Collections operations
from collections import Counter, defaultdict

word_count = Counter(["apple", "banana", "apple", "cherry"])
grouped_data = defaultdict(list)

# Time operations
current_time = time.time()
formatted_time = time.strftime("%Y-%m-%d %H:%M:%S")

print("Hover extension test complete!")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"Random number: {random.randint(1, 100)}")
