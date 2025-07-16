#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple Python Test Script
Created by VS Code MCP Server for execution demonstration
"""

import sys
import os
import json
from datetime import datetime

def analyze_segmentation_file():
    """Analyze the external Segmentation.py file structure"""
    
    segmentation_file = "/Users/braincraft/Desktop/segmentation-v3/seg_core/Segmentation.py"
    
    if not os.path.exists(segmentation_file):
        return {"error": "Segmentation file not found"}
    
    with open(segmentation_file, 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    # Basic analysis
    classes = []
    methods = []
    imports = []
    
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('class '):
            class_match = stripped.split()[1].split('(')[0].rstrip(':')
            classes.append(class_match)
        elif stripped.startswith('def '):
            method_match = stripped.split()[1].split('(')[0]
            methods.append(method_match)
        elif stripped.startswith(('import ', 'from ')):
            imports.append(stripped)
    
    return {
        "file": segmentation_file,
        "analysis_time": datetime.now().isoformat(),
        "stats": {
            "total_lines": len(lines),
            "classes": len(classes),
            "methods": len(methods),
            "imports": len(imports)
        },
        "classes_found": classes,
        "methods_found": methods[:10],  # First 10 methods
        "key_imports": [imp for imp in imports if any(lib in imp for lib in ['torch', 'cv2', 'numpy', 'PIL'])]
    }

def demonstrate_python_capabilities():
    """Demonstrate various Python capabilities"""
    
    print("🐍 Python Execution Test - MCP Server Demo")
    print("=" * 50)
    
    # Basic computation
    print("\n📊 Basic Computation:")
    numbers = [1, 2, 3, 4, 5]
    result = sum(x**2 for x in numbers)
    print(f"   Sum of squares [1-5]: {result}")
    
    # File analysis
    print("\n🔍 File Analysis:")
    analysis = analyze_segmentation_file()
    
    if "error" not in analysis:
        print(f"   ✅ Successfully analyzed: {os.path.basename(analysis['file'])}")
        print(f"   📈 Classes: {analysis['stats']['classes']}")
        print(f"   ⚙️  Methods: {analysis['stats']['methods']}")
        print(f"   📦 Imports: {analysis['stats']['imports']}")
        print(f"   🕒 Analysis time: {analysis['analysis_time']}")
        
        # Save results
        output_file = "/Users/braincraft/Desktop/vscode-mcp/python_analysis_results.json"
        with open(output_file, 'w') as f:
            json.dump(analysis, f, indent=2)
        print(f"   💾 Results saved to: {os.path.basename(output_file)}")
    else:
        print(f"   ❌ Error: {analysis['error']}")
    
    # System info
    print(f"\n🖥️  System Info:")
    print(f"   Python version: {sys.version.split()[0]}")
    print(f"   Platform: {sys.platform}")
    print(f"   Current directory: {os.getcwd()}")
    
    print("\n✅ Python execution test completed successfully!")
    return True

if __name__ == "__main__":
    demonstrate_python_capabilities()
