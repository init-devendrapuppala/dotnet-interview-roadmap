# Value Types vs Reference Types

> **One-Sentence Summary**
>
> Value types store the actual data, while reference types store a reference to an object. This difference determines how values are copied and how changes affect your application.

**Difficulty:** ⭐⭐⭐⭐☆  
**Reading Time:** ~7 minutes

---

# Introduction

Every type in C# falls into one of two categories:

- **Value Type**
- **Reference Type**

Understanding this distinction is essential because it affects how variables are copied, how objects behave when assigned to another variable, and how memory is managed by the runtime.

---

# Mental Model

### Value Type

Think of making a **photocopy**.

```
Original → 42

Copy     → 42
```

If you change the copy,

```
Original → 42

Copy     → 43
```

the original remains unchanged because each variable has its own copy.

---

### Reference Type

Think of sharing the same document.

```
Person A ───┐
            │
            ▼
      Student Record
            ▲
            │
Person B ───┘
```

If Person A edits the document, Person B immediately sees the changes because both are using the same document.

---

# Definition

## Value Type

A value type stores the actual data.

Assigning one variable to another copies the value.

Examples:

```csharp
int
bool
double
char
decimal
DateTime
Guid
struct
enum
```

---

## Reference Type

A reference type stores a reference to an object.

Assigning one variable to another copies the reference, not the object.

Examples:

```csharp
class
string
array
interface
delegate
record class
```

---

# Example

## Value Type

```csharp
int attendanceJan = 20;

int attendanceFeb = attendanceJan;

attendanceFeb = 18;

Console.WriteLine(attendanceJan);
Console.WriteLine(attendanceFeb);
```

Output

```
20
18
```

Changing `attendanceFeb` doesn't affect `attendanceJan` because a copy was created.

---

## Reference Type

```csharp
public class Student
{
    public string Name { get; set; } = string.Empty;
}

Student student1 = new()
{
    Name = "Rahul"
};

Student student2 = student1;

student2.Name = "Amit";

Console.WriteLine(student1.Name);
Console.WriteLine(student2.Name);
```

Output

```
Amit
Amit
```

Both variables point to the same object.

---

# Under the Hood

### Value Type Assignment

```csharp
int x = 10;
int y = x;
```

```
x → 10

y → 10
```

Changing `y`

```csharp
y = 20;
```

results in

```
x → 10

y → 20
```

Each variable owns its own value.

---

### Reference Type Assignment

```csharp
Student student1 = new Student();
Student student2 = student1;
```

```
student1
    │
    ▼
+----------------------+
| Student Object       |
+----------------------+
    ▲
    │
student2
```

Both variables point to the same object.

Changing the object through either variable changes what both variables see.

> **Note:** A reference type variable stores the reference, not the object itself.

---

# Interview Tips

💡 **"Value types are always stored on the stack."**

❌ Incorrect.

Their storage location depends on the context. We'll cover this in **Stack vs Heap**.

---

💡 **"Assigning a class creates a new object."**

❌ Incorrect.

Only the reference is copied.

---

💡 **"Reference variables contain the object."**

❌ Incorrect.

They contain only the reference to the object.

---

# Related Topics

- [stack-vs-heap.md](stack-vs-heap.md)
- objects.md
- garbage-collection.md
- boxing-and-unboxing.md

---

# Summary

- Value types store the actual data.
- Reference types store a reference to an object.
- Assigning a value type creates a new copy.
- Assigning a reference type copies only the reference.
- Multiple variables can point to the same object.
- This concept is the foundation for understanding memory management in .NET.

## Related Topics

- [Stack vs heap](stack-vs-heap.md)
- [Garbage collection](garbage-collection.md)
- [Boxing and unboxing](boxing-and-unboxing.md)
