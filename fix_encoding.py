#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
from pathlib import Path

project_root = r"c:\Users\PC\Documents\PROJECT\json-formatter"

# Mapping of corrupted characters to correct ones
replacements = {
    'ðŸ"§': '🔧',
    'ðŸŒ™': '🌙',
    'ðŸŒ³': '🌳',
    'ðŸ"‹': '📋',
    'â–¾': '▾',
    'â†'': '→',
    'â€"': '–',
    'â€"': '—',
    'â€"': '—',
    'â˜€ï¸': '☀️',
    'â¬‡ï¸': '⬇️',
    'â† ': '† ',
    'â€™': ''',
    'â€œ': '"',
    'â€\x9d': '"',
    'â€˜': ''',
}

def fix_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        for old, new in replacements.items():
            if old in content:
                content = content.replace(old, new)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

files_fixed = 0
for file_path in Path(project_root).rglob('*.html'):
    if fix_file(str(file_path)):
        print(f"✓ Fixed: {file_path.name}")
        files_fixed += 1

for file_path in Path(project_root).rglob('*.js'):
    if fix_file(str(file_path)):
        print(f"✓ Fixed: {file_path.name}")
        files_fixed += 1

print(f"\n✓ Total files fixed: {files_fixed}")
