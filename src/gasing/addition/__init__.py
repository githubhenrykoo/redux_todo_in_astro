"""
Gasing Addition Algorithm Package

This package contains various implementations of addition algorithms:
- gasing.py: The Gasing method for addition with lookahead carry detection
- basic.py: Basic right-to-left addition as typically taught in elementary school
- traditional.py: Traditional addition with detailed carry tracking
- position_wise.py: Position-wise addition without carrying
"""

from .gasing import carry_detection as gasing_carry_detection
from .basic import basic_addition
from .traditional import traditional_carry_detection, traditional_addition
from .position_wise import position_wise_addition, convert_to_decimal

__all__ = [
    'gasing_carry_detection',
    'basic_addition',
    'traditional_carry_detection',
    'traditional_addition',
    'position_wise_addition',
    'convert_to_decimal'
]
