"""
Month Parser: Extracts month references from user queries.

Handles various formats:
- "January, February, March"
- "Jan, Feb, Mar"
- "1, 2, 3"
- "last 3 months"
- "previous quarter"
- Mixed formats
"""

import re
from datetime import datetime, timedelta
from typing import Optional

MONTH_NAMES = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12,
}


def parse_months_from_query(user_query: str, current_date: datetime = None) -> Optional[list[tuple[int, int]]]:
    """
    Extracts month and year references from user query.
    
    Args:
        user_query: User's question text
        current_date: Reference date (defaults to today)
    
    Returns:
        List of (month, year) tuples, sorted chronologically.
        Returns None if no month references found.
        
    Examples:
        "Analyze expenses for January, February and March"
        → [(1, 2026), (2, 2026), (3, 2026)]
        
        "Last 3 months"
        → [(11, 2025), (12, 2025), (1, 2026)]  # if today is 2026-01
    """
    
    if current_date is None:
        current_date = datetime.today()
    
    current_year = current_date.year
    current_month = current_date.month
    
    found_months = set()
    query_lower = user_query.lower()
    
    # First, check for "last X months" / "previous X months"
    # Do this FIRST to avoid number conflicts with numeric month parsing
    last_n_match = re.search(r'(last|previous)\s+(\d+)\s+months?', query_lower)
    if last_n_match:
        n = int(last_n_match.group(2))
        # Get previous N months (not including current month)
        for i in range(1, n + 1):
            target_month = current_month - i
            target_year = current_year
            
            while target_month < 1:
                target_month += 12
                target_year -= 1
            
            found_months.add((target_month, target_year))
        
        # If we found "last X months", return early to avoid other patterns
        return sorted(list(found_months))
    
    # Check for "last month" / "previous month" / "last month"
    if re.search(r'(last|previous)\s+month(?!\s*\d)', query_lower):
        target_month = current_month - 1
        target_year = current_year
        
        if target_month < 1:
            target_month += 12
            target_year -= 1
        
        found_months.add((target_month, target_year))
        return sorted(list(found_months))
    
    # Pattern 2: "quarter" / "quarter 1" / "Q1"
    if re.search(r'(q|quarter)\s*1', query_lower) or 'q1' in query_lower.replace(' ', ''):
        found_months.update([(1, current_year), (2, current_year), (3, current_year)])
    elif re.search(r'(q|quarter)\s*2', query_lower) or 'q2' in query_lower.replace(' ', ''):
        found_months.update([(4, current_year), (5, current_year), (6, current_year)])
    elif re.search(r'(q|quarter)\s*3', query_lower) or 'q3' in query_lower.replace(' ', ''):
        found_months.update([(7, current_year), (8, current_year), (9, current_year)])
    elif re.search(r'(q|quarter)\s*4', query_lower) or 'q4' in query_lower.replace(' ', ''):
        found_months.update([(10, current_year), (11, current_year), (12, current_year)])
    
    # Pattern 3: Month names ("January", "Feb", etc.)
    # Use word boundaries to avoid partial matches
    for month_name, month_num in MONTH_NAMES.items():
        # Use word boundary to ensure we match complete month names
        if re.search(rf'\b{month_name}\b', query_lower):
            # Check if a year is specified near this month
            # Look for patterns like "January 2025" or "2025 January"
            year_pattern = re.search(
                rf'(?:20\d{{2}}|202[0-9])\s+{month_name}|{month_name}\s+(?:20\d{{2}}|202[0-9])',
                query_lower
            )
            if year_pattern:
                year_match = re.search(r'20\d{2}|202[0-9]', year_pattern.group())
                year = int(year_match.group())
            else:
                year = current_year
            
            found_months.add((month_num, year))
    
    # Pattern 4: Numeric months ("1, 2, 3" or "month 1, month 2")
    # Only match if prefixed with "month" to avoid conflicts with numbers in text
    numeric_pattern = re.findall(r'month\s+(\d{1,2})', query_lower)
    for month_str in numeric_pattern:
        month_num = int(month_str)
        if 1 <= month_num <= 12:
            # Check if a year is nearby
            year_near_pattern = re.search(rf'(20\d{{2}}|202[0-9])\D*month\s*{month_str}|month\s*{month_str}\D*(20\d{{2}}|202[0-9])', query_lower)
            if year_near_pattern:
                year_match = re.search(r'20\d{2}|202[0-9]', year_near_pattern.group())
                year = int(year_match.group())
            else:
                year = current_year
            
            found_months.add((month_num, year))
    
    if not found_months:
        return None
    
    # Sort chronologically
    sorted_months = sorted(list(found_months))
    return sorted_months
