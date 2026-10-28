# Variables

> **One-Sentence Summary**
>
> A variable is a named storage location that holds data while your application is running.

**Difficulty:** ⭐⭐☆☆☆
**Reading Time:** ~4 minutes

---

# Introduction

Every program works with data.

For example:

- A student's name
- Attendance count
- Total marks
- Fee amount

To work with this data, we need a way to store it in memory. That's exactly what a **variable** does.

---

# Definition

A **variable** is a named storage location that holds a value.

Think of it as a label that allows your code to access data stored in memory.

```csharp
int age = 20;
```

Here,

- `int` → Data type
- `age` → Variable name
- `20` → Value

---

# Declaring a Variable

A variable declaration consists of:

```text
<Data Type> <Variable Name>;
```

Example:

```csharp
int age;

string name;

bool isActive;
```

At this point, the variables are declared but not initialized.

---

# Initializing a Variable

Initialization means assigning a value to a variable.

```csharp
int age = 20;

string name = "Rahul";

bool isActive = true;
```

You can also initialize it later.

```csharp
int age;

age = 20;
```

---

# Changing a Variable

Variables can hold different values during program execution.

```csharp
int attendance = 20;

attendance = 21;

attendance = 22;
```

The variable name stays the same, but its value changes.

---

# Type Safety

A variable can store only values compatible with its data type.

✔ Valid

```csharp
int age = 20;
```

❌ Invalid

```csharp
int age = "Twenty";
```

The compiler reports an error because `"Twenty"` is a string, not an integer.

---

# Type Inference with `var`

Instead of explicitly writing the type, C# can infer it from the assigned value.

```csharp
var age = 20;
```

The compiler treats it as:

```csharp
int age = 20;
```

Similarly,

```csharp
var name = "Rahul";
```

becomes

```csharp
string name = "Rahul";
```

> **Important:** `var` is **not** a data type. The compiler determines the actual type during compilation.

---

# Common Naming Conventions

Use meaningful names.

✔ Good

```csharp
studentName

attendanceCount

totalMarks
```

❌ Avoid

```csharp
a

x

temp1
```

Unless the variable is used in a very small scope (such as a loop).

---

# Interview Tips

💡 **Is `var` dynamic?**

❌ No.

The compiler determines the type at compile time.

---

💡 **Can a variable change its data type?**

❌ No.

Once declared, its type is fixed.

---

💡 **Can you declare a variable without initializing it?**

✅ Yes.

```csharp
int age;
```

However, local variables must be assigned a value before they are used.

```csharp
int age;

Console.WriteLine(age); // Compile-time error
```

---

# Related Topics

- data-types.md
- type-conversion.md
- constants-and-readonly.md

---

# Summary

- A variable is a named storage location.
- Variables are declared using a data type and a name.
- Variables can be initialized when declared or later.
- A variable's type cannot change after declaration.
- `var` lets the compiler infer the type; it does not make the variable dynamic.

## Related Topics

- [Data types](data-types.md)
- [Type conversion](type-conversion.md)
- [Constants and readonly](constants-and-readonly.md)
