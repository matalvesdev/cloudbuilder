#!/usr/bin/env python3
"""Append a metrics entry to history.json with deduplication."""

import json
import sys

def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <entry.json> <history.json>")
        sys.exit(1)

    entry_path = sys.argv[1]
    history_path = sys.argv[2]

    with open(entry_path) as f:
        entry = json.load(f)

    try:
        with open(history_path) as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []

    # Dedup by commit + date
    entry_date = entry["timestamp"][:10]
    data = [
        d for d in data
        if not (d.get("commit") == entry["commit"]
                and d.get("timestamp", "").startswith(entry_date))
    ]

    data.append(entry)

    with open(history_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"History: {len(data)} entries")


if __name__ == "__main__":
    main()
