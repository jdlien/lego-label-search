# LEGO Part Number Pattern Analysis Report

## Overview

Analysis of 57,574 part numbers from the LEGO database reveals distinct patterns that can inform image matching strategies.

## Length Distribution

| Length | Count  | Percentage | Notes                                                |
| ------ | ------ | ---------- | ---------------------------------------------------- |
| 11     | 19,073 | 33.1%      | Most common - likely includes printed/color variants |
| 5      | 10,092 | 17.5%      | Standard 5-digit part numbers                        |
| 15     | 5,915  | 10.3%      | Extended format with multiple suffixes               |
| 10     | 5,089  | 8.8%       | Medium format                                        |
| 12     | 3,357  | 5.8%       | Extended format                                      |
| 17     | 2,019  | 3.5%       | Very long format                                     |
| 4      | 2,015  | 3.5%       | Short 4-digit numbers                                |
| 7      | 1,900  | 3.3%       | 7-character format                                   |
| 6      | 1,380  | 2.4%       | 6-digit format (often with leading zeros)            |

## Starting Character Distribution

| First Char | Count  | Percentage | Pattern Type               |
| ---------- | ------ | ---------- | -------------------------- |
| 9          | 13,048 | 22.7%      | Numeric parts              |
| 3          | 12,483 | 21.7%      | Numeric parts              |
| 1          | 6,455  | 11.2%      | Numeric parts              |
| 4          | 5,482  | 9.5%       | Numeric parts              |
| 2          | 5,366  | 9.3%       | Numeric parts              |
| 6          | 4,025  | 7.0%       | Numeric parts              |
| 5          | 2,299  | 4.0%       | Numeric parts              |
| c          | 2,264  | 3.9%       | Special/custom parts       |
| 7          | 2,017  | 3.5%       | Numeric parts              |
| 8          | 1,957  | 3.4%       | Numeric parts              |
| u          | 767    | 1.3%       | Unknown part numbers (UPN) |
| p          | 532    | 0.9%       | Special parts              |

## Major Pattern Categories

### 1. Pure Numeric Parts (13,939 parts - 24.2%)

**Format**: `003381`, `3429`, `4158`

- Often have leading zeros (6-digit format)
- Core LEGO part numbers
- **Image Matching Strategy**: Try both with and without leading zeros

### 2. Printed Parts (38,175 parts - 66.3%)

**Format**: `01586pr0001`, `3001pr0123`

- Contains "pr" followed by 4-digit print code
- Base part + print variant
- **Image Matching Strategy**: Try base part number (strip "pr" suffix)

### 3. Color Variants (6,242 parts)

**Format**: `100811c01`, `upn0063c01`

- Contains "c" followed by 2-digit color code
- **Image Matching Strategy**: Try base part number (strip "c" suffix)

### 4. Letter Suffixes

**Format**: `100392a`, `100392b`, `100392c`

- Single letter variants (a, b, c, etc.)
- **Image Matching Strategy**: Try base part number (strip letter suffix)

### 5. Special Categories

- **UPN (Unknown Part Numbers)**: `upn0001`, `upn0001pr0001` (767 parts)
- **Stickers**: `stickerupn0001` (171 parts)
- **Cards**: `cardupn0001pr0001`
- **Dummy Parts**: `100811c01dummy`
- **Pattern Parts**: `01675pat0001`

### 6. Complex Combinations

**Format**: `100559pat0001pr0001`

- Multiple suffixes combined
- Pattern + print variants
- **Image Matching Strategy**: Progressive stripping of suffixes

## Recommended Image Matching Enhancements

### 1. Hierarchical Matching Strategy

```
For part "01586pr0001":
1. Try exact match: "01586pr0001"
2. Try base part: "01586" (strip pr suffix)
3. Try with leading zeros: "001586"
4. Try without leading zeros: "1586"
```

### 2. Suffix Stripping Patterns

- Strip `pr[0-9]{4}` (print codes)
- Strip `c[0-9]{2}` (color codes)
- Strip `pat[0-9]{4}` (pattern codes)
- Strip single letter suffixes `[a-z]$`
- Strip `dummy$`
- Strip `LR$` or `RL$` (left/right variants)

### 3. Base Part Extraction

For complex parts like `100559pat0001pr0001`:

1. Extract base: `100559`
2. Try intermediate forms: `100559pat0001`
3. Try all variations with/without leading zeros

### 4. Special Handling

- **UPN parts**: May not have corresponding images
- **Sticker parts**: Likely have different naming conventions
- **Dummy parts**: Probably no images available

## Implementation Recommendations

1. **Create a base part extractor function** that progressively strips known suffixes
2. **Implement suffix priority** (strip print codes before color codes)
3. **Add validation** to ensure stripped parts are reasonable (not too short)
4. **Cache base part mappings** for performance
5. **Add logging** for complex transformations to debug matching issues

## Example Enhanced Matching Logic

```javascript
function generatePartVariations(partId) {
  const variations = [partId] // Start with original

  let basePart = partId

  // Strip known suffixes in order of priority
  basePart = basePart.replace(/pr\d{4}$/, '') // Remove print codes
  if (basePart !== partId) variations.push(basePart)

  basePart = basePart.replace(/c\d{2}$/, '') // Remove color codes
  if (basePart !== variations[variations.length - 1]) variations.push(basePart)

  basePart = basePart.replace(/pat\d{4}$/, '') // Remove pattern codes
  if (basePart !== variations[variations.length - 1]) variations.push(basePart)

  basePart = basePart.replace(/[a-z]$/, '') // Remove letter suffixes
  if (basePart !== variations[variations.length - 1]) variations.push(basePart)

  basePart = basePart.replace(/dummy$/, '') // Remove dummy suffix
  if (basePart !== variations[variations.length - 1]) variations.push(basePart)

  // Add leading zero variations for each base
  const finalVariations = []
  for (const variant of variations) {
    finalVariations.push(variant)
    finalVariations.push(variant.replace(/^0+/, '')) // Strip leading zeros
    finalVariations.push(variant.padStart(6, '0')) // Pad to 6 digits
  }

  return [...new Set(finalVariations)] // Remove duplicates
}
```

This enhanced approach should significantly improve image matching accuracy while maintaining the strict exact-match requirement we implemented.
