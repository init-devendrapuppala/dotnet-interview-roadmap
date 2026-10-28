# Boxing and Unboxing

> **One-Sentence Summary**
>
> Boxing converts a value type into a reference type, while unboxing converts it back to the original value type.

**Difficulty:** ⭐⭐⭐☆☆
**Reading Time:** ~6 minutes

---

# Introduction

Earlier, we learned that:

- Value types store the actual value.
- Reference types store a reference to an object.

Sometimes, the CLR needs to treat a value type as an object. To do this, it performs **Boxing**.

When we want the original value back, we perform **Unboxing**.

---

# Mental Model

Imagine you have a gift.

```
Gift
```

To ship it, you place it inside a box.

```
+------------+
|   Gift     |
+------------+
```

The gift hasn't changed.

It's simply wrapped so it can be handled differently.

That's exactly what **Boxing** does.

---

# Boxing

Boxing converts a **value type** into a **reference type**.

Example:

```csharp
int number = 10;

object obj = number;
```

Conceptually,

```
Stack

number = 10

↓

CLR creates

↓

Heap

+-----------+
|    10     |
+-----------+

obj ─────────►
```

The integer is copied into a newly allocated object on the managed heap.

> **Important:** Boxing creates a **new object**.

---

# Unboxing

Unboxing extracts the original value from a boxed object.

```csharp
object obj = 10;

int number = (int)obj;
```

Conceptually,

```
Heap

+-----------+
|    10     |
+-----------+

↓

Copy value

↓

Stack

number = 10
```

> **Important:** Unboxing requires an explicit cast.

---

# Complete Example

```csharp
int number = 10;

// Boxing
object obj = number;

// Unboxing
int value = (int)obj;

Console.WriteLine(value);
```

Output

```
10
```

---

# Under the Hood

When boxing occurs:

```
Value Type

↓

Allocate new object on Heap

↓

Copy value into object

↓

Return object reference
```

When unboxing occurs:

```
Reference

↓

Verify object contains expected value type

↓

Copy value back

↓

Store in value type variable
```

Notice that boxing involves:

- Heap allocation
- Copying the value

This makes it more expensive than a normal assignment.

---

# Why Should You Care?

Frequent boxing and unboxing can:

- Create unnecessary heap allocations
- Increase Garbage Collection pressure
- Reduce application performance

This is especially noticeable inside loops or high-performance code.

---

# Common Scenarios

### Using `object`

```csharp
object value = 100;
```

---

### Non-Generic Collections

Older collections like:

```csharp
ArrayList
Hashtable
```

box value types because they store objects.

Modern generic collections like `List<int>` avoid this overhead.

---

# Interview Tips

💡 **Does boxing create a new object?**

✅ Yes.

---

💡 **Does boxing modify the original value?**

❌ No.

A copy is placed inside the boxed object.

---

💡 **Is unboxing automatic?**

❌ No.

An explicit cast is required.

---

💡 **Why are generic collections faster than `ArrayList`?**

Because they avoid boxing and unboxing for value types.

---

# Summary

- Boxing converts a value type into an object.
- Unboxing converts the object back into the original value type.
- Boxing allocates a new object on the managed heap.
- Unboxing requires an explicit cast.
- Excessive boxing can impact performance and increase Garbage Collection.

## Related Topics

- [Value Types vs Reference Types](value-types-vs-reference-types.md)
- [Generics](generics.md)
- [Collections Overview](collections-overview.md)
- [Garbage Collection](garbage-collection.md)