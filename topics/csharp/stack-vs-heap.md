# Stack vs Heap

> **One-Sentence Summary**
>
> The stack and heap are two different memory regions used by the .NET runtime. Understanding when each is used helps explain memory allocation, performance, and object lifetime.

**Difficulty:** ⭐⭐⭐⭐☆
**Reading Time:** ~8 minutes

---

# Introduction

One of the biggest misconceptions in .NET interviews is:

> **"Value types are stored on the stack, and reference types are stored on the heap."**

This is **not entirely true**.

The **stack** and **heap** are different memory areas, but **where a value ends up depends on how it is used**, not simply whether it's a value type or reference type.

Understanding this distinction will also help you understand:

- Garbage Collection
- Boxing & Unboxing
- Method calls
- Object lifetime
- Performance

---

# Mental Model

Think of your application as an office.

## Stack

The stack is like your **work desk**.

- Small
- Organized
- Fast
- Temporary

You place documents on it while you're working.

When you're done, you clear the desk.

---

## Heap

The heap is like the **office storage room**.

- Much larger
- Shared
- Objects stay there until no one needs them
- Cleaned periodically by the Garbage Collector

---

# Definition

## Stack

The stack is a memory region used for:

- Method call frames
- Local variables
- Parameters
- Return addresses

Memory allocation and cleanup on the stack are extremely fast.

---

## Heap

The heap is a memory region used for dynamically allocated objects.

Objects remain in memory until they are no longer reachable, after which the Garbage Collector reclaims the memory.

---

# Example

```csharp
public class Student
{
    public string Name { get; set; } = "";
}

int age = 20;

Student student = new()
{
    Name = "Rahul"
};
```

Conceptually,

```
Stack

age = 20

student ───────────────┐
                       │
                       ▼

Heap

+----------------------+
| Student Object       |
| Name = Rahul         |
+----------------------+
```

Notice:

- `age` stores the value directly.
- `student` stores only a reference.
- The actual `Student` object lives on the managed heap.

---

# Important Interview Clarification

Consider this code.

```csharp
public struct Address
{
    public int ZipCode;
}

public class Student
{
    public Address Address;
}
```

Where is `Address` stored?

Many people answer:

> Stack

This is **incorrect**.

Since `Address` is a field inside a heap object (`Student`), it becomes part of that heap object.

```
Heap

Student Object

------------------

Name

Address.ZipCode
```

The value type itself is now stored inside the heap object.

> A value type is **not guaranteed** to live on the stack.

Its location depends on where it is declared.

---

# Under the Hood

When a method is called,

```
Method Call

↓

Stack Frame Created

↓

Local Variables Allocated

↓

Method Executes

↓

Stack Frame Removed
```

Stack memory is automatically reclaimed when the method returns.

---

Creating an object using `new`

```csharp
Student student = new();
```

Conceptually,

```
CLR

↓

Allocate memory on Managed Heap

↓

Create Student object

↓

Return reference

↓

Store reference in local variable
```

The object remains alive until it is no longer reachable.

---

# Performance

## Stack

✅ Very fast allocation

✅ Very fast cleanup

No Garbage Collection required.

---

## Heap

Allocation is still efficient, but:

- Objects survive beyond a single method.
- Memory must eventually be reclaimed by the Garbage Collector.
- Larger number of allocations increases GC work.

---

# Interview Tips

💡 **"Value types always live on the stack."**

❌ Incorrect.

They can also exist inside heap objects.

---

💡 **"Reference types live on the stack."**

❌ Partially incorrect.

The **reference variable** may live on the stack.

The **object** lives on the managed heap.

---

💡 **"The heap is slower because it's random memory."**

❌ Incorrect.

Heap allocation itself is efficient.

The additional cost usually comes from **Garbage Collection**, not from allocating the object.

---

# Related Topics

- value-types-vs-reference-types.md
- objects.md
- garbage-collection.md
- boxing-and-unboxing.md

---

# Summary

- The stack stores method execution data such as local variables and parameters.
- The heap stores dynamically allocated objects.
- A reference variable and the object it references can exist in different memory regions.
- Value types are **not always** stored on the stack.
- Understanding the stack and heap is fundamental to understanding how the CLR manages memory.

## Related Topics

- [Value types vs reference types](value-types-vs-reference-types.md)
- [Garbage collection](garbage-collection.md)
- [Boxing and unboxing](boxing-and-unboxing.md)
