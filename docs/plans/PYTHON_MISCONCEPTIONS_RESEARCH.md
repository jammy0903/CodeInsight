# Python Misconceptions Research

> Research collected from academic papers, Stack Overflow, Reddit, and documentation.
> Used to enhance lesson explanations in CodeInsight.

## Sources

### Academic/Documentation
- **Hitchhiker's Guide to Python** - Common Gotchas
- **Stack Overflow** - "Least Astonishment" mutable default argument (270+ votes)
- **Martin Heinz Blog** - Python Pitfalls
- **Toptal** - 10 Most Common Python Mistakes
- **KDnuggets** - Python Oddities

### Community Discussions
- **Reddit r/Python** - PEP 671 late binding discussion
- **Software Engineering SE** - Mutable default argument debates

---

## Top Python Misconceptions

### 1. Mutable Default Arguments (MOST COMMON)

**The Bug:**
```python
def add_item(item, items=[]):
    items.append(item)
    return items

add_item(1)  # [1]
add_item(2)  # [1, 2] - NOT [2]!
add_item(3)  # [1, 2, 3] - NOT [3]!
```

**Why It Happens:**
- Default values are evaluated ONCE at function **definition time**
- The same list object is reused across all calls
- "The WORST noob error in Python" (Carberra, YouTube 2025)

**The Fix:**
```python
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

**Interview Frequency:** ~80% of Python interviews mention this

**Map to Lesson:** py-4-4 (Default argument trap)

---

### 2. Variables as Labels, Not Boxes

**The Misconception:**
```python
# Thinking: a is a "box" containing [1, 2, 3]
a = [1, 2, 3]
b = a  # Thinking: copied to a new box "b"
b.append(4)
print(a)  # [1, 2, 3, 4] - SURPRISE!
```

**Reality:**
- Variables are **name tags** pointing to objects
- `b = a` creates ANOTHER tag pointing to SAME object
- Both `a` and `b` are aliases for ONE list

**Visual:**
```
a ────┐
      ├──→ [1, 2, 3, 4]
b ────┘
```

**Map to Lesson:** py-1-1, py-3-1, py-3-2

---

### 3. Late Binding Closures

**The Bug:**
```python
funcs = []
for i in range(3):
    funcs.append(lambda: i)

funcs[0]()  # 2 - NOT 0!
funcs[1]()  # 2 - NOT 1!
funcs[2]()  # 2
```

**Why It Happens:**
- Closures capture VARIABLES, not VALUES
- `i` is looked up when lambda is CALLED, not defined
- By call time, loop is done and i=2

**The Fix (Early Binding):**
```python
funcs = []
for i in range(3):
    funcs.append(lambda i=i: i)  # Default arg binds NOW
```

**Map to Lesson:** py-5-4 (should add closure lesson)

---

### 4. Pass by Assignment

**Common Wrong Beliefs:**
1. "Python is pass-by-value" - WRONG
2. "Python is pass-by-reference" - ALSO WRONG
3. "Modifying argument always changes original" - WRONG

**Reality - Pass by Assignment:**
```python
def modify(x):
    x = x + [4]  # Creates NEW object, rebinds x
    
lst = [1, 2, 3]
modify(lst)
print(lst)  # [1, 2, 3] - NOT changed!
```

```python
def modify(x):
    x.append(4)  # Modifies SAME object
    
lst = [1, 2, 3]
modify(lst)
print(lst)  # [1, 2, 3, 4] - Changed!
```

**Key Insight:**
- Function parameters are LOCAL VARIABLES
- Assigned to point at the argument object
- Rebinding (=) changes what local points to
- Mutation (.append) modifies the shared object

**Map to Lesson:** py-4-1, py-4-2, py-4-3

---

### 5. LEGB Scope Rule Confusion

**The Bug:**
```python
x = 10
def foo():
    print(x)  # UnboundLocalError!
    x = 20
```

**Why It Happens:**
- Python scans ENTIRE function for assignments
- `x = 20` makes `x` a LOCAL variable for the WHOLE function
- Even lines BEFORE the assignment see `x` as local
- Local `x` hasn't been assigned yet when print(x) runs

**The Fix:**
```python
x = 10
def foo():
    global x
    print(x)  # 10
    x = 20
```

**Map to Lesson:** py-5-1, py-5-2, py-5-3

---

### 6. Integer Identity Caching

**The Surprise:**
```python
a = 256
b = 256
a is b  # True

a = 257
b = 257
a is b  # False (usually)
```

**Why:**
- Python caches integers from -5 to 256
- Outside this range, new objects are created
- Never use `is` for value comparison!

**Map to Lesson:** py-1-2 (id, type, value)

---

### 7. String Immutability

**The Misconception:**
```python
s = "hello"
s[0] = "H"  # TypeError!
```

**The Surprise:**
```python
s = "hello"
s += " world"  # Works! But creates NEW string
```

**Key Insight:**
- Strings are IMMUTABLE
- `+=` creates a brand new string object
- Original "hello" is not modified

**Map to Lesson:** py-2-1, py-2-4

---

## Additional Misconceptions (Future Lessons)

### Class Variables vs Instance Variables
```python
class Dog:
    tricks = []  # SHARED across all instances!
    
d1 = Dog()
d2 = Dog()
d1.tricks.append("roll")
print(d2.tricks)  # ["roll"] - SURPRISE!
```
**Map to Lesson:** py-8-4

### `is` vs `==`
```python
a = [1, 2, 3]
b = [1, 2, 3]
a == b  # True (same value)
a is b  # False (different objects)
```
**Map to Lesson:** py-1-2

---

## Research Sources

1. https://docs.python-guide.org/writing/gotchas/
2. https://stackoverflow.com/questions/1132941/least-astonishment-and-the-mutable-default-argument
3. https://martinheinz.dev/blog/37
4. https://www.toptal.com/python/top-10-mistakes-that-python-programmers-make
5. https://www.kdnuggets.com/python-oddities-might-surprise-you

---

## Application Status

| Misconception | Target Lesson | Status |
|---------------|---------------|--------|
| Mutable default argument | py-4-4 | Pending |
| Variables as labels | py-1-1 | Pending |
| Late binding closures | py-5-4 | Pending |
| Pass by assignment | py-4-1~4-3 | Pending |
| LEGB scope confusion | py-5-1~5-3 | Pending |
| Integer caching | py-1-2 | Pending |
| String immutability | py-2-1, py-2-4 | Pending |
