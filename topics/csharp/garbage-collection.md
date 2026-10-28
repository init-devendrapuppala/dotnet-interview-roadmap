# Garbage Collection (GC)

> **One-Sentence Summary**
>
> Garbage Collection is an automatic memory management system that frees memory occupied by objects that are no longer reachable by your application.

**Difficulty:** ⭐⭐⭐⭐⭐
**Reading Time:** ~10 minutes

---

# Introduction

In languages like C and C++, developers manually allocate and free memory.

```cpp
Student* student = new Student();

delete student;
```

Forgetting to free memory causes **memory leaks**.

Freeing memory too early can cause **application crashes**.

.NET solves this problem using the **Garbage Collector (GC)**.

Instead of manually deleting objects, the CLR automatically identifies objects that are no longer needed and reclaims their memory.

---

# Why Do We Need Garbage Collection?

Consider the following code.

```csharp
public void CreateStudent()
{
    Student student = new Student();
}
```

When the method finishes, the `student` variable goes out of scope.

No part of the application can access the `Student` object anymore.

```
Before Method Ends

student ─────► Student Object
```

After the method returns,

```
Student Object

(No references)
```

The object has become **unreachable**.

Keeping it in memory serves no purpose.

The Garbage Collector will eventually reclaim that memory.

---

# How Garbage Collection Works

The Garbage Collector does **not** continuously delete objects.

Instead, it runs periodically when the CLR decides memory should be reclaimed.

Conceptually,

```
Application Running

↓

Objects Created

↓

Some Objects Become Unreachable

↓

GC Runs

↓

Unused Objects Removed

↓

Memory Reclaimed
```

---

# Reachable vs Unreachable Objects

The GC only removes **unreachable** objects.

### Reachable

```
student ─────► Student Object
```

The object is still in use.

GC leaves it alone.

---

### Unreachable

```
Student Object

(No references)
```

Nothing points to the object anymore.

It becomes eligible for collection.

> **Important:** Eligible for collection does **not** mean it is immediately removed.

---

# Generations

The CLR divides objects into generations.

```
Gen 0

↓

Gen 1

↓

Gen 2
```

### Generation 0

- Newly created objects
- Collected most frequently

Examples:

- DTOs
- Temporary strings
- Request objects

---

### Generation 1

Objects that survive a Gen 0 collection.

---

### Generation 2

Long-lived objects.

Examples:

- Application caches
- Singleton services
- Long-running objects

Gen 2 collections happen less frequently because they're more expensive.

---

# Example

```csharp
public void ProcessStudent()
{
    Student student = new Student();

    Console.WriteLine(student.Name);
}
```

When the method exits,

```
student

↓

(out of scope)
```

The `Student` object becomes unreachable.

The GC will eventually reclaim its memory.

---

# Large Object Heap (LOH)

Objects larger than approximately **85 KB** are allocated on the **Large Object Heap**.

Examples:

- Large arrays
- Large byte buffers
- Large images

LOH collections are more expensive than normal heap collections.

This is one reason repeatedly allocating large objects can hurt performance.

---

# Common Misconceptions

### "GC immediately deletes objects."

❌ Incorrect.

Objects are collected only when the CLR decides a collection is necessary.

---

### "Setting an object to null frees memory."

```csharp
student = null;
```

❌ Incorrect.

It only removes one reference.

The object is collected only if it becomes unreachable.

---

### "Calling GC.Collect() improves performance."

❌ Usually incorrect.

The CLR is far better at deciding when to perform garbage collection.

Calling `GC.Collect()` unnecessarily often reduces performance.

---

# Interview Tips

💡 **Does .NET use reference counting?**

No.

The .NET Garbage Collector uses a tracing, generational garbage collector.

---

💡 **Can the GC collect an object that is still referenced?**

No.

Reachable objects are not collected.

---

💡 **Can you predict exactly when GC runs?**

No.

The CLR decides when a collection should occur.

---

# Related Topics

- stack-vs-heap.md
- objects.md
- boxing-and-unboxing.md
- disposable-and-using.md

---

# Summary

- Garbage Collection automatically reclaims memory occupied by unreachable objects.
- Objects become eligible for collection when nothing references them.
- Collection is automatic and controlled by the CLR.
- The GC is generational (Gen 0, Gen 1, Gen 2).
- Large objects are allocated on the Large Object Heap (LOH).
- Avoid forcing garbage collection using `GC.Collect()` unless you have a very specific reason.

## Related Topics

- [Stack vs heap](stack-vs-heap.md)
- [Boxing and unboxing](boxing-and-unboxing.md)
- [Disposable and using](disposable-and-using.md)
