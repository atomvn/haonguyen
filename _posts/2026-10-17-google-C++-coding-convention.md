---
layout: post
title: google C++ coding convention 
date: 2026-10-17 00:00:00
description: 
tags: coding-convention
categories: 
thumbnail: assets/img/posts/2026-10-17/google-code.png
featured: false
---

### 1. Header files
Trong hầu hết trường hợp, tất cả các file .cc đều phải có file header .h đi kèm. Một số trường hợp ngoại lệ có thể là các file unit test và các file nhỏ chỉ chứa ain function.
#### 1.1. Self-contained headers
##### 1.1.1. Các quy chuẩn chung
- Tất cả các file header phải mang tính tự chứa (self-contained), nghĩa là chúng có thể tự biên dịch một cách độc lập.
- Bắt buộc phải có header guards (hoặc #pragma once) và tự động include tất cả các header khác mà nó phụ thuộc.

##### 1.1.2. Quy định về inline function và template
- Khi một header khai báo các hàm inline hoặc template mà các client sử dụng nó sẽ khởi tạo (instantiate), các định nghĩa này phải nằm trực tiếp trong header (hoặc trong các file mà header đó include).

- Ngoại lệ duy nhất là khi toàn bộ các instantiation của template chỉ xảy ra trong đúng một file .cc (do tường minh hoặc chỉ file đó truy cập được), thì template definition có thể giữ lại trong file .cc đó.
```c++
// math_utils.h
#ifndef MATH_UTILS_H
#define MATH_UTILS_H

#include <cmath>       // Tự include các dependency mà nó cần[cite: 1]
#include <iostream>

// 1. Hàm inline được định nghĩa trực tiếp trong header[cite: 1]
inline int square(int x) {
    return x * x;
}

// 2. Template được định nghĩa trực tiếp trong header (Không tách file -inl.h)[cite: 1]
template <typename T>
T findMax(T a, T b) {
    return (a > b) ? a : b;
}

#endif // MATH_UTILS_H
```

#### 1.2. The #define guard
Tất cả các header files cần có header guard #define để tránh multiple inclusion, format của 1 header guard sẽ tuân theo dạng: `<PROJECT>_<PATH>_<FILE>_H_`.   
Để đảm bảo tính độc nhất, header phải dựa trên đường dẫn tuyệt đối tới project's source tree. Ví dụ với file /foo/src/bar/baz.h, thì nó sẽ có header như sau:
```c++
#ifndef FOO_BAR_BAZ_H_
#define FOO_BAR_BAZ_H_

...

#endif  // FOO_BAR_BAZ_H_
```

#### 1.3. Include what you use
Tự chịu trách nhiệm về dependency: Nếu một file code (có thể là .h hoặc .cc) sử dụng bất kỳ symbol nào (như class, struct, hàm, biến, hằng số...) được định nghĩa ở nơi khác, file đó bắt buộc phải tự include trực tiếp file header cung cấp symbol đó.   
Áp dụng cho cả cặp file .cc và .h: Nếu file thực thi foo.cc sử dụng một symbol từ bar.h, thì foo.cc vẫn phải tự viết #include "bar.h", ngay cả khi file header đi kèm của nó là foo.h đã include bar.h rồi.

#### 1.4. Forward Declarations
Forward Declaration (Khai báo trước) là việc khai báo sự tồn tại của một thực thể (như class, hàm, biến, cờ...) với trình biên dịch mà chưa cung cấp định nghĩa chi tiết của thực thể đó tại thời điểm khai báo. Ví dụ:

```c++
class B;                 // Khai báo trước lớp B (chưa biết bên trong có gì)
void FuncInB();          // Khai báo trước hàm
extern int variable_in_b;// Khai báo trước biến toàn cục
```