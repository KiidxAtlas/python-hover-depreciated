#!/usr/bin/env python3
"""
Python Hover Extension Test File
================================

This file contains comprehensive examples to test all features of the Python Hover extension.
Hover over any highlighted keyword, function, method, or construct to see the documentation.

Features tested:
- Built-in functions (70+)
- String methods (42+)
- List, dict, and set methods
- Language constructs
- Standard library imports
- Type hints and modern Python patterns
- Context-aware method resolution
"""

# =============================================================================
# BUILT-IN FUNCTIONS TESTING
# =============================================================================

# Basic built-ins - hover over each function name
print("Testing built-in functions:")
result = len([1, 2, 3, 4, 5])
data = list(range(10))
numbers = tuple(enumerate(data))
maximum = max(numbers)
minimum = min(numbers)
total = sum([1, 2, 3, 4, 5])
absolute = abs(-42)
rounded = round(3.14159, 2)

# Advanced built-ins
user_input = input("Enter something: ")  # Hover over 'input'
code_result = eval("2 + 2")  # Hover over 'eval'
compiled_code = compile("x = 1", "<string>", "exec")  # Hover over 'compile'
object_hash = hash("test")  # Hover over 'hash'
hex_value = hex(255)  # Hover over 'hex'
octal_value = oct(8)  # Hover over 'oct'
binary_value = bin(10)  # Hover over 'bin'

# Character and string conversions
ascii_value = ord("A")  # Hover over 'ord'
character = chr(65)  # Hover over 'chr'
ascii_repr = ascii("hello")  # Hover over 'ascii'
string_repr = repr([1, 2, 3])  # Hover over 'repr'

# Utility functions
is_callable = callable(print)  # Hover over 'callable'
division_result = divmod(17, 5)  # Hover over 'divmod'
formatted = format(42, "b")  # Hover over 'format'

# Python 3.7+ features
breakpoint()  # Hover over 'breakpoint' - debugging function
local_vars = locals()  # Hover over 'locals'
global_vars = globals()  # Hover over 'globals'

# =============================================================================
# STRING METHODS TESTING
# =============================================================================

# String method examples - hover over each method
text = "  Hello, World!  "
print("\nTesting string methods:")

# Basic string operations
cleaned = text.strip()  # Hover over 'strip'
words = text.split()  # Hover over 'split'
joined = "-".join(words)  # Hover over 'join'
replaced = text.replace("World", "Python")  # Hover over 'replace'
position = text.find("World")  # Hover over 'find'

# Case operations
upper_text = text.upper()  # Hover over 'upper'
lower_text = text.lower()  # Hover over 'lower'
title_text = text.title()  # Hover over 'title'
capitalized = text.capitalize()  # Hover over 'capitalize'

# String validation
is_digit = "123".isdigit()  # Hover over 'isdigit'
is_alpha = "abc".isalpha()  # Hover over 'isalpha'
is_alnum = "abc123".isalnum()  # Hover over 'isalnum'

# String testing
starts_with = text.startswith("  Hello")  # Hover over 'startswith'
ends_with = text.endswith("!  ")  # Hover over 'endswith'
count_chars = text.count("l")  # Hover over 'count'

# String formatting
centered = text.center(30)  # Hover over 'center'
left_justified = text.ljust(30)  # Hover over 'ljust'
right_justified = text.rjust(30)  # Hover over 'rjust'
zero_filled = "42".zfill(5)  # Hover over 'zfill'

# Python 3.9+ string methods
prefix_removed = "Hello World".removeprefix("Hello ")  # Hover over 'removeprefix'
suffix_removed = "Hello World".removesuffix(" World")  # Hover over 'removesuffix'

# Encoding
encoded = text.encode("utf-8")  # Hover over 'encode'

# =============================================================================
# LIST METHODS TESTING
# =============================================================================

# List method examples - hover over each method
my_list = [1, 2, 3]
print("\nTesting list methods:")

my_list.append(4)  # Hover over 'append'
my_list.extend([5, 6, 7])  # Hover over 'extend'
my_list.insert(0, 0)  # Hover over 'insert'
my_list.remove(3)  # Hover over 'remove'
popped = my_list.pop()  # Hover over 'pop'
copied_list = my_list.copy()  # Hover over 'copy'
my_list.reverse()  # Hover over 'reverse'
my_list.sort()  # Hover over 'sort'
my_list.clear()  # Hover over 'clear'

# =============================================================================
# DICTIONARY METHODS TESTING
# =============================================================================

# Dictionary method examples - hover over each method
my_dict = {"name": "John", "age": 30, "city": "New York"}
print("\nTesting dictionary methods:")

keys = my_dict.keys()  # Hover over 'keys'
values = my_dict.values()  # Hover over 'values'
items = my_dict.items()  # Hover over 'items'
name = my_dict.get("name", "Unknown")  # Hover over 'get'
my_dict.setdefault("country", "USA")  # Hover over 'setdefault'
my_dict.update({"occupation": "Developer"})  # Hover over 'update'
popped_item = my_dict.popitem()  # Hover over 'popitem'
new_dict = dict.fromkeys(["a", "b", "c"], 0)  # Hover over 'fromkeys'

# =============================================================================
# SET METHODS TESTING
# =============================================================================

# Set method examples - hover over each method
my_set = {1, 2, 3, 4, 5}
other_set = {4, 5, 6, 7, 8}
print("\nTesting set methods:")

my_set.add(6)  # Hover over 'add'
my_set.discard(1)  # Hover over 'discard'
union_result = my_set.union(other_set)  # Hover over 'union'
intersection_result = my_set.intersection(other_set)  # Hover over 'intersection'
difference_result = my_set.difference(other_set)  # Hover over 'difference'
symmetric_diff = my_set.symmetric_difference(
    other_set
)  # Hover over 'symmetric_difference'
is_subset = my_set.issubset(other_set)  # Hover over 'issubset'
is_superset = my_set.issuperset(other_set)  # Hover over 'issuperset'
is_disjoint = my_set.isdisjoint(other_set)  # Hover over 'isdisjoint'

# =============================================================================
# LANGUAGE CONSTRUCTS TESTING
# =============================================================================


# Class definition - hover over 'class'
class Person:  # Hover over 'class'
    """A simple Person class to demonstrate OOP concepts."""

    def __init__(self, name: str, age: int):  # Hover over 'def'
        self.name = name
        self.age = age

    def greet(self) -> str:  # Hover over 'return'
        return f"Hello, I'm {self.name}!"  # Hover over 'return'


# Function with type hints - hover over 'def'
def calculate_area(length: float, width: float) -> float:  # Hover over 'def'
    """Calculate the area of a rectangle."""
    return length * width  # Hover over 'return'


# Control structures
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# For loop - hover over 'for'
for num in numbers:  # Hover over 'for'
    if num % 2 == 0:  # Hover over 'if'
        print(f"{num} is even")
    else:  # Hover over 'else'
        print(f"{num} is odd")

    if num > 5:  # Hover over 'break'
        break  # Hover over 'break'

# While loop - hover over 'while'
counter = 0
while counter < 5:  # Hover over 'while'
    print(f"Counter: {counter}")
    counter += 1
    if counter == 3:
        continue  # Hover over 'continue'

# Exception handling - hover over 'try', 'except', 'finally'
try:  # Hover over 'try'
    result = 10 / 0
except ZeroDivisionError as e:  # Hover over 'except'
    print(f"Error: {e}")
finally:  # Hover over 'finally'
    print("Cleanup code")

# Context manager - hover over 'with'
with open(__file__, "r") as file:  # Hover over 'with'
    content = file.read()

# Lambda function - hover over 'lambda'
square = lambda x: x**2  # Hover over 'lambda'

# List comprehension with advanced constructs
squared_evens = [x**2 for x in range(10) if x % 2 == 0]  # Hover over 'if'


# Generator function - hover over 'yield'
def fibonacci_generator():  # Hover over 'def'
    a, b = 0, 1
    while True:  # Hover over 'while'
        yield a  # Hover over 'yield'
        a, b = b, a + b


# Async function - hover over 'async', 'await'
import asyncio


async def async_function():  # Hover over 'async'
    await asyncio.sleep(1)  # Hover over 'await'
    return "Done!"


# Match statement (Python 3.10+) - hover over 'match', 'case'
def process_value(value):
    match value:  # Hover over 'match'
        case 0:  # Hover over 'case'
            return "Zero"
        case x if x > 0:  # Hover over 'case'
            return "Positive"
        case _:  # Hover over 'case'
            return "Negative"


# Assertions and error handling
assert 1 + 1 == 2, "Math is broken!"  # Hover over 'assert'

try:
    raise ValueError("This is a test error")  # Hover over 'raise'
except ValueError:
    pass  # Hover over 'pass'

# Global and nonlocal
global_var = "I'm global"


def outer_function():
    outer_var = "I'm in outer"

    def inner_function():
        nonlocal outer_var  # Hover over 'nonlocal'
        global global_var  # Hover over 'global'
        outer_var = "Modified"
        return outer_var


# =============================================================================
# IMPORT STATEMENTS TESTING
# =============================================================================

import collections  # Hover over 'collections'
import csv  # Hover over 'csv'
import datetime  # Hover over 'datetime'
import itertools  # Hover over 'itertools'
import json  # Hover over 'json'
import math  # Hover over 'math'
import multiprocessing  # Hover over 'multiprocessing'

# Standard library imports - hover over each module name
import os  # Hover over 'os'
import pathlib  # Hover over 'pathlib'
import random  # Hover over 'random'
import re  # Hover over 're'
import sqlite3  # Hover over 'sqlite3'
import sys  # Hover over 'sys'
import threading  # Hover over 'threading'
import typing  # Hover over 'typing'
from collections import Counter, defaultdict  # Hover over 'collections'

# From imports
from datetime import datetime, timedelta  # Hover over 'datetime'
from pathlib import Path  # Hover over 'pathlib'
from typing import Dict, List, Optional, Union  # Hover over 'typing'

# =============================================================================
# DATA TYPES TESTING
# =============================================================================

# Basic data types - hover over each type
string_var = str("Hello")  # Hover over 'str'
integer_var = int(42)  # Hover over 'int'
float_var = float(3.14)  # Hover over 'float'
boolean_var = bool(True)  # Hover over 'bool'
list_var = list([1, 2, 3])  # Hover over 'list'
dict_var = dict({"key": "value"})  # Hover over 'dict'
set_var = set({1, 2, 3})  # Hover over 'set'
tuple_var = tuple((1, 2, 3))  # Hover over 'tuple'
bytes_var = bytes([65, 66, 67])  # Hover over 'bytes'
bytearray_var = bytearray([65, 66, 67])  # Hover over 'bytearray'
complex_var = complex(1, 2)  # Hover over 'complex'

# =============================================================================
# ADVANCED PYTHON FEATURES
# =============================================================================

# Type hints and annotations
from typing import Generic, Protocol, TypeVar

T = TypeVar("T")  # Hover over 'TypeVar'


class Stack(Generic[T]):  # Hover over 'Generic'
    def __init__(self) -> None:
        self._items: List[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> Optional[T]:
        return self._items.pop() if self._items else None


# Protocol definition
class Drawable(Protocol):  # Hover over 'Protocol'
    def draw(self) -> None: ...


# Decorators
def my_decorator(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)

    return wrapper


@my_decorator  # Hover over the decorator
def decorated_function():
    return "I'm decorated!"


# Property decorator
class Circle:
    def __init__(self, radius: float):
        self._radius = radius

    @property  # Hover over 'property'
    def area(self) -> float:
        return math.pi * self._radius**2


# Static and class methods
class MathUtils:
    def __init__(self, base_value: int = 0):
        self.base_value = base_value

    @staticmethod  # Hover over 'staticmethod'
    def add(a: int, b: int) -> int:
        return a + b

    @classmethod  # Hover over 'classmethod'
    def from_string(cls, value: str):
        return cls(int(value))


# Super function
class Animal():
    def __init__(self, name: str):
        self.name = name

    def speak(self) -> str:
        return f"{self.name} makes a sound"


class Dog(Animal):
    def __init__(self, name: str, breed: str):
        super().__init__(name)  # Hover over 'super'
        self.breed = breed

    def speak(self) -> str:
        return f"{self.name} barks"


# =============================================================================
# CONTEXT-AWARE TESTING
# =============================================================================

# These examples test the extension's context-aware method resolution
print("\nTesting context-aware method resolution:")

# String context
greeting = "hello world"
uppercase_greeting = greeting.upper()  # Should show string.upper() docs

# List context
numbers_list = [1, 2, 3, 4, 5]
numbers_list.append(6)  # Should show list.append() docs

# Dict context
person_dict = {"name": "Alice", "age": 25}
person_name = person_dict.get("name")  # Should show dict.get() docs

# Set context
unique_numbers = {1, 2, 3, 4, 5}
unique_numbers.add(6)  # Should show set.add() docs

# =============================================================================
# USAGE EXAMPLES
# =============================================================================

if __name__ == "__main__":
    print("Python Hover Extension Test File")
    print("=" * 40)
    print("Hover over any keyword, function, or method to see documentation!")
    print("This file tests all 300+ supported Python constructs.")

    # Test the extension by hovering over various elements
    person = Person("Alice", 30)
    print(person.greet())

    area = calculate_area(5.0, 3.0)
    print(f"Area: {area}")

    # Test async function
    async def main():
        result = await async_function()
        print(f"Async result: {result}")

    # Run the async function
    asyncio.run(main())
