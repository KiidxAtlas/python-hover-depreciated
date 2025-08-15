#!/usr/bin/env python3
"""
Enhanced Python file for testing the improved Python Hover extension.

Test these new features:
1. Hover over KEYWORDS: class, def, try, import, with, async/await, yield, for/while loops
2. Hover over BUILT-INS: print, len, range, enumerate, zip, map, filter, sorted, sum, max, min
3. Hover over DATA TYPES: str, int, float, bool, list, dict, set, tuple
4. Hover over CONSTANTS: None, True, False
5. Hover over CONTROL: break, continue, pass, return, raise, assert, del
"""

import asyncio
import json
import os
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional

# Test constants
DEBUG = True
VERSION = "1.0.0"
CONFIG_PATH = None

class ExampleClass:
    """A sample class to demonstrate enhanced hover documentation."""

    def __init__(self, name: str, items: List[str] = None):
        self.name = name
        self.items = items or []

    def __str__(self) -> str:
        return f"ExampleClass(name={self.name}, items={len(self.items)})"

    def __len__(self) -> int:
        return len(self.items)

    @classmethod
    def from_config(cls, config_path: Path) -> 'ExampleClass':
        """Create instance from configuration file."""
        try:
            with open(config_path) as f:
                config = json.loads(f.read())
            return cls(config.get('name', 'default'), config.get('items', []))
        except FileNotFoundError:
            print(f"Config file not found: {config_path}")
            return cls('default')
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in config: {e}")
        finally:
            print("Config loading completed")

    @staticmethod
    def utility_method(data: Any) -> str:
        """Static utility method."""
        return str(data).upper()

    @property
    def item_count(self) -> int:
        """Property example."""
        return len(self.items)

def example_function(items: List[str], threshold: int = 10) -> Optional[Dict[str, Any]]:
    """Demonstrates various Python keywords and built-ins."""

    if not items:
        return None
    elif len(items) > threshold:
        print(f"Processing {len(items)} items (above threshold)")

    # Test built-in functions
    filtered_items = list(filter(lambda x: x.strip(), items))
    mapped_items = list(map(str.upper, filtered_items))
    sorted_items = sorted(mapped_items)

    # Test data types and type checking
    result: Dict[str, Any] = {
        'total': len(items),
        'filtered': len(filtered_items),
        'unique': len(set(filtered_items)),
        'max_len': max(len(item) for item in filtered_items) if filtered_items else 0,
        'min_len': min(len(item) for item in filtered_items) if filtered_items else 0,
        'sum_lens': sum(len(item) for item in filtered_items)
    }

    # Exception handling example
    try:
        result['average'] = result['sum_lens'] / result['total']
    except ZeroDivisionError:
        result['average'] = 0.0
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise  # Re-raise
    else:
        print("Average calculated successfully")
    finally:
        print("Calculation completed")

    return result

def process_with_loops(data: List[Any]) -> List[Any]:
    """Test various loop constructs and control flow."""
    processed = []

    # Enumerate example
    for index, item in enumerate(data):
        if item is None:
            continue  # Skip None values
        elif isinstance(item, str) and item.startswith('#'):
            break  # Stop at comment marker
        elif isinstance(item, (int, float)) and item < 0:
            pass  # Do nothing for negative numbers
        else:
            processed.append((index, item))

    # While loop with else
    counter = 0
    while counter < len(processed):
        if processed[counter][1] == 'STOP':
            break
        counter += 1
    else:
        print("While loop completed normally")

    # Zip example
    indices = range(len(processed))
    zipped_data = list(zip(indices, processed))

    return processed

async def async_example(urls: List[str]) -> List[str]:
    """Demonstrates async/await keywords."""
    results = []

    for url in urls:
        try:
            # Simulate async operation
            await asyncio.sleep(0.1)
            result = f"Processed: {url}"
            results.append(result)
        except Exception as e:
            print(f"Error processing {url}: {e}")

    return results

def generator_example(n: int):
    """Demonstrates yield keyword and generators."""
    for i in range(n):
        if i % 2 == 0:
            yield i * 2
        else:
            yield from [i, i + 1]  # yield from syntax

def context_manager_example():
    """Demonstrates with statement and context managers."""

    # Single context manager
    with open('example.txt', 'w') as f:
        f.write("Hello, world!")

    # Multiple context managers
    try:
        with open('input.txt') as inp, open('output.txt', 'w') as out:
            content = inp.read()
            out.write(content.upper())
    except FileNotFoundError:
        print("Input file not found")

    # Custom context manager
    class CustomContext:
        def __enter__(self):
            print("Entering context")
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            print("Exiting context")
            return False

    with CustomContext():
        print("Inside custom context")

def variable_scope_examples():
    """Test global and nonlocal keywords."""
    global DEBUG

    local_var = "local"

    def nested_function():
        nonlocal local_var
        global VERSION

        local_var = "modified local"
        VERSION = "2.0.0"

        print(f"Modified: {local_var}, {VERSION}")

    nested_function()
    return local_var

def assertion_and_deletion():
    """Test assert and del keywords."""
    data = [1, 2, 3, 4, 5]

    # Assertion examples
    assert len(data) > 0, "Data should not be empty"
    assert all(isinstance(x, int) for x in data), "All items should be integers"

    # Deletion examples
    del data[0]  # Remove first element
    assert len(data) == 4

    temp_var = "temporary"
    del temp_var  # Delete variable

    return data

def match_case_example(value: Any) -> str:
    """Pattern matching example (Python 3.10+)."""
    match value:
        case int() if value > 0:
            return "Positive integer"
        case int() if value < 0:
            return "Negative integer"
        case 0:
            return "Zero"
        case str() if len(value) > 10:
            return "Long string"
        case str():
            return "Short string"
        case [x, y] if isinstance(x, int) and isinstance(y, int):
            return f"Two integers: {x}, {y}"
        case _:
            return "Unknown type"

# Lambda examples with built-ins
numbers = [1, 2, 3, 4, 5, -1, -2]
squares = list(map(lambda x: x**2, numbers))
positive = list(filter(lambda x: x > 0, numbers))
absolute_values = list(map(abs, numbers))
rounded_values = list(map(lambda x: round(x, 2), [3.14159, 2.71828]))

# Type examples
example_str = str(123)
example_int = int("456")
example_float = float("3.14")
example_bool = bool(1)
example_list = list(range(5))
example_dict = dict(zip(['a', 'b', 'c'], [1, 2, 3]))
example_set = set([1, 2, 2, 3, 3, 3])
example_tuple = tuple(range(3))

if __name__ == "__main__":
    print("Testing enhanced Python hover extension...")

    # Test class instantiation
    example = ExampleClass("Test", ["item1", "item2", "item3"])
    print(f"Created: {example}")

    # Test function calls
    items = ["hello", "world", "#comment", "python", ""]
    result = example_function(items)
    print(f"Function result: {result}")

    # Test generator
    gen_values = list(generator_example(5))
    print(f"Generator values: {gen_values}")

    # Test async (would need to be run in async context)
    # asyncio.run(async_example(["url1", "url2"]))

    # Test other features
    processed = process_with_loops([1, 2, None, "test", -1, "STOP", "ignored"])
    print(f"Processed: {processed}")

    context_manager_example()
    modified = variable_scope_examples()
    print(f"Modified local variable: {modified}")

    cleaned_data = assertion_and_deletion()
    print(f"Cleaned data: {cleaned_data}")

    # Test pattern matching
    test_values = [42, -10, 0, "hello", "very long string here", [1, 2], {"key": "value"}]
    for val in test_values:
        try:
            match_result = match_case_example(val)
            print(f"Match {val}: {match_result}")
        except NameError:
            print(f"Pattern matching not available (Python < 3.10)")
            break

    print("All tests completed!")
