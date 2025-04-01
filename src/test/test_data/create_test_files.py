from PIL import Image, ImageDraw
import io
import wave
import numpy as np
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import json
import struct
from pathlib import Path

def create_png():
    """Create a simple PNG image"""
    img = Image.new('RGB', (100, 100), color='white')
    d = ImageDraw.Draw(img)
    d.rectangle([20, 20, 80, 80], fill='blue', outline='black')
    img.save('tests/test_data/sample.png')

def create_pdf():
    """Create a PDF document"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(100, 750, "Sample PDF Content")
    c.rect(100, 700, 100, 100, fill=1)
    c.save()
    
    with open('tests/test_data/sample.pdf', 'wb') as f:
        f.write(buffer.getvalue())

def create_wav():
    """Create a WAV audio file with a simple sine wave"""
    samplerate = 44100
    duration = 1  # seconds
    frequency = 440  # Hz (A4 note)
    
    t = np.linspace(0, duration, int(samplerate * duration))
    samples = (np.sin(2 * np.pi * frequency * t) * 32767).astype(np.int16)
    
    with wave.open('tests/test_data/sample.wav', 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 2 bytes per sample
        wav_file.setframerate(samplerate)
        wav_file.writeframes(samples.tobytes())

def create_obj():
    """Create a simple 3D OBJ file (a triangle)"""
    obj_content = """# Simple triangle
v 0.0 0.0 0.0
v 1.0 0.0 0.0
v 0.0 1.0 0.0
f 1 2 3
"""
    with open('tests/test_data/sample.obj', 'w') as f:
        f.write(obj_content)

def create_tex():
    """Create a LaTeX document"""
    tex_content = r"""\documentclass{article}
\begin{document}
\title{Sample \LaTeX{} Document}
\author{Test Author}
\maketitle

\section{Introduction}
This is a sample \LaTeX{} document for testing binary storage.

\end{document}
"""
    with open('tests/test_data/sample.tex', 'w') as f:
        f.write(tex_content)

def create_mermaid():
    """Create a Mermaid diagram"""
    mermaid_content = """graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[Cancel]
"""
    with open('tests/test_data/sample.mmd', 'w') as f:
        f.write(mermaid_content)

def create_json():
    """Create a JSON file"""
    data = {
        "name": "Test Object",
        "properties": {
            "color": "blue",
            "size": 100,
            "nested": {
                "array": [1, 2, 3],
                "boolean": True
            }
        }
    }
    with open('tests/test_data/sample.json', 'w') as f:
        json.dump(data, f, indent=2)

def create_binary():
    """Create a custom binary file format"""
    # Simple binary format:
    # - 4 bytes: Magic number (0x4D434152 - 'MCAR' in ASCII)
    # - 4 bytes: Version (1)
    # - 4 bytes: Data length
    # - N bytes: Data
    magic = 0x4D434152
    version = 1
    data = b"This is custom binary data"
    data_length = len(data)

    with open('tests/test_data/sample.bin', 'wb') as f:
        f.write(struct.pack('>III', magic, version, data_length))
        f.write(data)

def create_csv():
    """Create a CSV file"""
    csv_content = """id,name,value
1,Item 1,100
2,Item 2,200
3,Item 3,300
"""
    with open('tests/test_data/sample.csv', 'w') as f:
        f.write(csv_content)

def create_markdown():
    """Create a Markdown file"""
    md_content = """# Sample Markdown Document

## Introduction
This is a sample markdown file with various elements:

* Lists
* **Bold text**
* *Italic text*

```python
def code_block():
    return "Hello, World!"
```
"""
    with open('tests/test_data/sample.md', 'w') as f:
        f.write(md_content)

def create_yaml():
    """Create a YAML file"""
    yaml_content = """---
version: '3'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/data
"""
    with open('tests/test_data/sample.yaml', 'w') as f:
        f.write(yaml_content)

if __name__ == '__main__':
    # Create directory if it doesn't exist
    Path('tests/test_data').mkdir(parents=True, exist_ok=True)
    
    # Create all test files
    create_png()
    create_pdf()
    create_wav()
    create_obj()
    create_tex()
    create_mermaid()
    create_json()
    create_binary()
    create_csv()
    create_markdown()
    create_yaml()
