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

Ví dụ giữa việc sử dụng #include và forward declarations:   
Giả định bạn đang xây dựng lớp Car (Xe hơi), và lớp này có liên quan đến lớp Engine (Động cơ). Chúng ta sẽ xem xét cách viết code trong hai trường hợp khác nhau.

1. Trường hợp 1: Sử dụng #include (Full inclusion)   
Khi bạn dùng #include "Engine.h", trình biên dịch sẽ đọc toàn bộ nội dung của file Engine.h.

    ```c++
   // --- Engine.h ---
    #ifndef ENGINE_H
    #define ENGINE_H

    class Engine {
    public:
        void start();
    private:
        int horsepower;
        // Nếu sau này có thêm thuộc tính ở đây, mọi file include Engine.h sẽ phải biên dịch lại
    };

    #endif 
    ```

    ```c++
    // --- Car.h ---
    #ifndef CAR_H
    #define CAR_H

    #include "Engine.h" // 👈 Dùng #include trực tiếp

    class Car {
    public:
        void drive();
    private:
        Engine myEngine; // 🟢 HỢP LỆ: Lưu đối tượng trực tiếp theo giá trị (by value)
    };

    #endif
    ```
    - Ưu điểm: Trình biên dịch biết chính xác kích thước của lớp Engine, cho phép bạn khai báo đối tượng myEngine trực tiếp theo kiểu giá trị (lưu trực tiếp trên bộ nhớ của Car).   
    - Nhược điểm: Mỗi khi file Engine.h thay đổi dù là nhỏ nhất (thêm/bớt biến thành viên), toàn bộ các file khác include Car.h đều bị bắt buộc biên dịch lại (recompilation cascade), làm tốn thời gian build dự án lớn.

2. Trường hợp 2: Sử dụng Forward Declaration (class Engine;)
Khi bạn dùng khai báo trước, bạn chỉ nói với trình biên dịch rằng "Có một lớp tên là Engine tồn tại đấy, cứ yên tâm đi", mà không cần nạp nội dung chi tiết của nó.

    ```c++
    // --- Car.h ---
    #ifndef CAR_H
    #define CAR_H

    // #include "Engine.h" -> KHÔNG CẦN NỮA
    class Engine; // 👈 Khai báo trước (Forward Declaration)

    class Car {
    public:
        void drive();
    private:
        Engine* enginePtr; // 🟢 HỢP LỆ: Chỉ dùng con trỏ (hoặc tham chiếu)
        // ❌ KHÔNG THỂ DÙNG: Engine myEngine; -> Lỗi biên dịch vì chưa biết kích thước của Engine!
    };

    #endif
    ```

    Và trong file mã nguồn thực thi Car.cc, bạn mới thực hiện #include "Engine.h" để gọi các phương thức của Engine:
 
    ```c++
    // --- Car.cc ---
    #include "Car.h"
    #include "Engine.h" // 👈 Bắt buộc phải include ở đây để dùng được phương thức của Engine

    void Car::drive() {
        enginePtr->start(); // Gọi method từ Engine
    }
    ```

    -Ưu điểm: Tiết kiệm thời gian biên dịch: Nếu file Engine.h thay đổi, file Car.h không cần phải biên dịch lại, vì Car.h không hề biết gì về chi tiết bên trong của Engine.
    -Nhược điểm: Bạn không thể khai báo đối tượng theo giá trị (Engine myEngine) trong Car.h vì trình biên dịch lúc này chưa biết kích thước của Engine (gọi là incomplete type). Bạn bắt buộc phải dùng con trỏ (Engine*) hoặc tham chiếu (Engine&). Trong file Car.cc, bạn vẫn phải viết #include "Engine.h" nếu muốn gọi hàm hay truy cập thành phần của Engine.

Chốt lại một vài điểm sau về forward declarations:
1. Tuyệt đối không dùng forward declarations cho các thực thể mà dự án của bạn không sở hữu (external/third-party entities).
2. Đối với các thực thể do chính dự án của bạn sở hữu:
    - Hãy cố gắng thiết kế file header sao cho việc include nó trở nên "rẻ" (nhẹ nhàng, ít phụ thuộc) để có thể include trực tiếp.
    - Nếu file header quá nặng nề, hãy tìm cách tối ưu tốc độ biên dịch của chính header đó trước.
    - Nếu sau khi cân nhắc kỹ lưỡng, bạn nhận thấy forward declaration thực sự là cách duy nhất và tốt nhất để khắc phục tình trạng chậm biên dịch, hãy dùng nó bằng chính phán đoán kỹ thuật tốt nhất của bạn.

#### 1.5. Defining functions in header files
Một vài quy tắc về việc define hàm trong header files:
1. Chỉ định nghĩa hàm tại phần khai báo công khai nếu nó ngắn (từ 10 dòng trở xuống).
2. Đẩy hàm dài vào file .cc: Các thân hàm dài hơn phải được đặt trong file .cc, trừ khi bắt buộc phải ở header vì lý do hiệu năng hoặc kỹ thuật.
3. Ẩn chi tiết cài đặt trong Header: Nếu một định nghĩa bắt buộc phải nằm trong header, không đặt nó ở phần public. Hãy đặt nó ở phần nội bộ (internal) của header, ví dụ:
    - Phần private của một lớp.
    - Bên trong một namespace chứa từ khóa internal.
    - Bên dưới dòng chú thích như // Implementation details only below here.

4. Đảm bảo tính ODR (One definition rule) -safe: Mọi định nghĩa trong header phải an toàn ODR bằng cách sử dụng từ khóa inline, hoặc được ngầm định là inline (như function template hoặc hàm được định nghĩa trực tiếp trong thân class khi khai báo lần đầu).

:question: Tại sao function definition trong header file lại phải định nghĩa inline, inline function hay variable là gì?   

inline là một từ khóa trong C++ dùng để gợi ý cho trình biên dịch (compiler) rằng: "Thay vì thực hiện một lời gọi hàm thông thường (nhảy đến một địa chỉ bộ nhớ chứa hàm rồi quay lại), hãy sao chép toàn bộ thân hàm này dán thẳng vào vị trí nó được gọi".   

Sự khác biệt giữa inline function và hàm thông thường:
- Hàm thông thường: Khi gọi hàm, CPU phải thực hiện các thao tác phụ: đẩy tham số vào stack, lưu địa chỉ hiện tại, nhảy đến vùng nhớ chứa hàm, thực thi, rồi nhảy ngược về vị trí cũ (gọi là function call overhead).
- Inline function: Lời gọi hàm bị "xóa sổ" lúc biên dịch và thay thế bằng chính đoạn code bên trong hàm đó.

Ưu điểm của inline function:
- Tăng tốc độ thực thi: Loại bỏ hoàn toàn chi phí nhảy hàm (overhead), rất hiệu quả cho các hàm nhỏ, chạy hàng triệu lần trong các vòng lặp (ví dụ: hàm lấy giá trị biến getters/setters).
- Tiết kiệm tài nguyên: Tránh được việc quản lý stack frame cho các tác vụ siêu nhỏ.

Nhược điểm (Tác hại nếu lạm dụng):
- Phình to mã máy (Code Bloat): Nếu bạn dùng inline cho một hàm dài và gọi nó ở 50 nơi khác nhau trong chương trình, trình biên dịch sẽ sao chép đoạn code dài đó ra 50 chỗ, làm dung lượng file thực thi tăng vọt.
- Lãng phí Cache CPU: Khi file mã máy quá lớn, nó dễ bị tràn bộ nhớ cache của CPU, từ đó lại làm hệ thống chạy chậm đi thay vì nhanh lên.

Ví dụ về quy tắc defining functions in header files:

```c++
#include <iostream>

template <typename T>
class Foo {
 public:
  // 1. Hàm ngắn (<= 10 dòng) được định nghĩa ngay trong phần public của class
  int bar() { 
      return bar_; 
  }

  // 2. Hàm dài chỉ được KHAI BÁO trước ở phần public (giữ API sạch sẽ, dễ đọc)
  void MethodWithHugeBody();

 private:
  int bar_;
};

// =====================================================================
// Implementation details only below here (Chi tiết cài đặt nằm ở dưới cùng)
// =====================================================================

// 3. Định nghĩa của hàm dài được đặt ở phần nội bộ bên dưới file header
template <typename T>
void Foo<T>::MethodWithHugeBody() {
    // Đoạn code logic phức tạp, dài dòng nằm ở đây
    std::cout << "Executing huge body logic..." << std::endl;
}
```

#### 1.6. Names and Order of Includes
##### 1.6.1. Thứ tự của các câu lệnh #include
Khi viết code trong các file nguồn (như dir/foo.cc hoặc dir/foo_test.cc nhằm cài đặt/kiểm thử cho dir2/foo2.h), bạn phải sắp xếp các câu lệnh #include theo thứ tự từ trên xuống dưới như sau:
1. Related header: File header liên quan trực tiếp (ví dụ: dir2/foo2.h) để đảm bảo file header này tự chứa (self-contained) và tự chịu trách nhiệm về các dependency của nó.
2. Một dòng trống.
3. C system headers và các hệ thống khác có đuôi .h trong dấu ngoặc nhọn (ví dụ: <unistd.h>, <stdlib.h>, <Python.h>).
4. Một dòng trống.
5. C++ standard library headers (thường không có phần mở rộng file, ví dụ: <algorithm>, <cstddef>). Lưu ý các file header kiểu C như <stddef.h> có thể thay thế tương đương bằng bản C++ (cstddef), hãy giữ tính nhất quán với code hiện có.
6. Một dòng trống.
7. Other libraries' headers (thư viện của bên thứ ba, ví dụ: thư viện Abseil).
8. Một dòng trống.
9. Your project's headers (các header nội bộ trong dự án của bạn).

Quy tắc phân tách: Tách biệt mỗi nhóm không trống bằng đúng một dòng trống, và sắp xếp alphabet cho các include bên trong mỗi nhóm.

:question: Tại sao phải đặt related header lên đầu?   
Việc đặt file header liên quan trực tiếp lên dòng đầu tiên giúp đảm bảo rằng nếu file header đó (dir2/foo2.h) quên include bất kỳ thư viện cần thiết nào, quá trình biên dịch của file .cc sẽ bị lỗi ngay lập tức đối với chính lập trình viên đang viết code đó, thay vì đẩy lỗi sang cho người khác ở các package khác.

##### 1.6.2. Quy tắc về đường dẫn (Path rules)
- Không dùng bí danh thư mục Unix: Tất cả các file header của dự án phải được liệt kê dưới dạng hậu duệ (descendants) của thư mục nguồn dự án mà không sử dụng các ký hiệu như . (thư mục hiện tại) hay .. (thư mục cha).
Ví dụ: Thay vì viết `#include "./basictypes.h"` hoặc `#include "../base/basictypes.h"`, bạn bắt buộc phải viết: `#include "base/basictypes.h"`

- Khi nào dùng dấu ngoặc nhọn góc (<>)?: Chỉ sử dụng đường dẫn đặt trong dấu ngoặc nhọn khi thư viện bắt buộc, bao gồm:
    - Thư viện chuẩn C và C++ (ví dụ: <stdlib.h>, <string>).
    - System headers của POSIX, Linux, và Windows (ví dụ: <unistd.h>, <windows.h>).
    - Trong một số ít trường hợp là thư viện third_party (ví dụ: <Python.h>).

##### 1.6.3. Conditional includes
Đôi khi mã nguồn đặc thù theo hệ điều hành (system-specific code) cần dùng các tiền xử lý điều kiện như #ifdef. Các include này có thể được đặt sau các include thông thường khác. Tuy nhiên, hãy cố gắng giữ phần code phụ thuộc hệ điều hành này thật nhỏ gọn vàcục bộ.

```c++
#include "foo/public/fooserver.h"

#ifdef _WIN32
#include <windows.h>
#endif  // _WIN32
```

Ví dụ thực tế cho các nguyên tắc trên:   
Dưới đây là một ví dụ tổng hợp cách sắp xếp các câu lệnh #include chuẩn chỉnh trong một file nguồn của dự án (ví dụ: google-awesome-project/src/foo/internal/fooserver.cc):

```c++
// 1. Related header trước tiên
#include "foo/server/fooserver.h"

// 2. C system headers / Thư viện hệ thống có dấu ngoặc nhọn
#include <sys/types.h>
#include <unistd.h>

// 3. C++ standard library headers (không có đuôi .h)
#include <string>
#include <vector>

// 4. Project's headers khác (được sắp xếp theo thứ tự alphabet)
#include "base/basictypes.h"
#include "foo/server/bar.h"

// 5. Thư viện bên thứ ba (Third-party libraries)
#include "third_party/absl/flags/flag.h"
```

### 2. Scoping
#### 2.1. Namespaces
Trừ 1 số trường hợp ngoại lệ, hãy sử dụng namespace bởi vì nó giúp chia global scope của ta thành các thành phần nhỏ hơn, tránh việc name collisions ở phạm vi global scope. Namespace phải có unique name, và có thể đi kèm theo path của nó. Không nên dùng using namespace ..., không nên dùng inline namespace.

Các quy tắc cụ thể khi sử dụng namespace:
- Hãy đặt tên namespace theo quy tắc ở phần Namespace Names.
- Namespace sẽ bao trùm toàn bộ mã nguồn của file, nhưng đặt sau các câu lệnh #include, định nghĩa/khai báo gflags, và các câu lệnh khai báo trước (forward declarations) từ namespace khác.
- Các khai báo bên trong namespace không bị thụt lề (không lùi vào trong một tab).
- Các namespace nhiều dòng phải có dòng chú thích ở dấu ngoặc nhọn đóng để dễ nhận biết.
    Ví dụ:
    ```c++
    // --- Trong file .h ---
    #ifndef MY_CLASS_H
    #define MY_CLASS_H

    #include <string>

    namespace mynamespace {

    // Không thụt lề bên trong namespace scope
    class MyClass {
    public:
    void Foo();
    };

    }  // namespace mynamespace  <-- Chú thích kết thúc bắt buộc

    #endif
    ```
    ```c++
    // --- Trong file .cc ---
    #include "my_class.h"
    #include <iostream>

    // Các gflags hoặc include đặt ở ngoài namespace
    ABSL_FLAG(bool, someflag, false, "a flag");

    namespace mynamespace {

    // Sử dụng using-declaration (được phép)
    using ::foo::Bar;

    void MyClass::Foo() {
        // Code bên trong giữ sát lề trái
        std::cout << "Foo executed!" << std::endl;
    }

    }  // namespace mynamespace
    ```
- Tuyệt đối không được khai báo bất cứ thứ gì bên trong không gian tên std (kể cả forward declaration các lớp thư viện chuẩn). Hành vi này là undefined behavior (không xác định và không di Port được). Hãy dùng cách #include thư viện tương ứng.
- Cấm dùng using-directive toàn cục (using namespace foo;): Không được dùng lệnh using namespace ... để lôi toàn bộ tên ra ngoài vì nó làm ô nhiễm namespace. Chỉ được dùng using-declaration cho từng tên cụ thể (using ::foo::Bar).   
    Ví dụ:
    ```c++
    #include <iostream>

    namespace math_lib {
        int add(int a, int b) { return a + b; }
        int multiply(int a, int b) { return a * b; }
    }

    // ✅ ĐÚNG: Chỉ kéo duy nhất hàm multiply ra, các thứ khác vẫn được giữ an toàn trong namespace của nó
    using math_lib::multiply; 

    int add(int a, int b) { 
        return a + b; // Không sợ xung đột với math_lib::add vì ta không lôi nó ra
    }

    int main() {
        std::cout << multiply(2, 3) << std::endl; // Dùng thoải mái
        return 0;
    }
    ```
- Trong file Header (.h): Không được sử dụng alias ở phạm vi namespace trong file header, vì nó sẽ bị xuất khẩu ra ngoài thành phần của Public API. Ngoại trừ các namespace được đánh dấu nội bộ rõ ràng (internal) hoặc khai báo cục bộ bên trong hàm/inline function.
- Trong file Code (.cc): Thoải mái dùng alias để rút gọn các tên dài.
    ```c++
    // --- Trong file .h (Đúng cách dùng ẩn trong internal hoặc local) ---
    namespace librarian {
    namespace internal {  // Nội bộ, không phải public API
        namespace sidetable = ::pipeline_diagnostics::sidetable;
    }

    inline void my_inline_function() {
        namespace baz = ::foo::bar::baz;  // Cục bộ trong hàm
    }
    }  // namespace librarian

    // --- Trong file .cc (Rút gọn tên cho dễ nhìn) ---
    namespace sidetable = ::pipeline_diagnostics::sidetable;
    ```
- Không dùng Inline Namespaces: Quy chuẩn yêu cầu tránh hoàn toàn việc sử dụng inline namespaces.
- Dùng từ khóa internal để ẩn chi tiết cài đặt: Đặt tên namespace có chứa chữ internal để cảnh báo người dùng không được sử dụng trực tiếp các thành phần bên trong đó.
- Tránh xung đột tên nội bộ: Mỗi thư viện nên gắn thêm tên file của mình vào namespace internal (ví dụ: gshoe::internal_widget thay vì chỉ dùng gshoe::internal).
    ```c++
    // Gắn tên file/thư viện vào internal để tránh va chạm giữa các module
    namespace gshoe {
    namespace internal_widget {
        void SecretImplementationDetails(); // Người dùng API không nên gọi hàm này
    }
    }  // namespace gshoe::internal_widget
    ```
- Trong các mã nguồn viết mới, cú pháp lồng nhau dạng một dòng được ưu tiên sử dụng vì sự gọn gàng:
    ```c++
    // Cú pháp gọn gàng được khuyến nghị cho code mới
    namespace my_project::my_component {

    void ProcessData() {
        // ...
    }

    }  // namespace my_project::my_component
    ```

#### 2.2. Internal linkage
Việc sử dụng internal linkage (Tức là đưa các definitions vào trong 1 unnamed namespace hoặc declare chúng là static) được khuyến kích cho tất cả các code không cần refer ra ngoài. Không sử dụng internal linkage trong file .h.

```c++
namespace {
...
}  // namespace
```

#### 2.3. Local variables
3 điều cần nhớ với local variables:
- Phạm vi hẹp nhất (Narrowest Scope): Đặt biến ở phạm vi nhỏ nhất có thể, tránh để biến sống sót rộng hơn mức cần thiết.
- Khởi tạo ngay khi khai báo (Initialize at Declaration): Luôn khởi tạo giá trị cho biến ngay tại thời điểm khai báo, tuyệt đối tránh việc khai báo một dòng rồi gán giá trị ở dòng sau.
- Khai báo sát thời điểm sử dụng: Khai báo biến càng gần với lần sử dụng đầu tiên càng tốt để người đọc dễ dàng nhận biết kiểu dữ liệu và giá trị ban đầu của nó.

Quy tắc chi tiết và ví dụ:
1. Khởi tạo ngay khi khai báo (Thay vì tách rời)  
    Sai: Khai báo trước, gọi hàm gán giá trị sau.

    ```c++
    int i;
    i = f();  // ❌ Không tốt: Tách biệt giữa khai báo và khởi tạo
    ```

    Đúng: Đi kèm khởi tạo luôn

    ```c++
    int i = f();  // ✅ Tốt: Khai báo có khởi tạo rõ ràng
    ```
2. Khai báo sát vị trí sử dụng  
    Sai: Khai báo biến từ rất sớm, cách xa đoạn code sử dụng nó.

    ```c++
    int jobs = NumJobs();
    // ... (hàng loạt đoạn code dài khác chưa dùng đến biến jobs) ...
    f(jobs);  // ❌ Không tốt: Khai báo quá xa chỗ dùng
    ```
    Đúng: Khai báo ngay trước dòng sử dụng nó.
    ```c++
    // ... code khác ...
    int jobs = NumJobs();
    f(jobs);  // ✅ Tốt: Khai báo ngay lập tức (hoặc sát) thời điểm sử dụng
    ```

3. Khởi tạo danh sách cho Container (std::vector)

    Thay vì tạo vector trống rồi dùng push_back nhiều lần, hãy dùng cú pháp khởi tạo trực tiếp:
    ```c++
    // ❌ Không tối ưu cho việc gán nhiều dòng
    std::vector<int> v;
    v.push_back(1);
    v.push_back(2);

    // ✅ Tốt: Khởi tạo gọn gàng ngay từ đầu
    std::vector<int> v = {1, 2};
    ```
4. Khai báo biến bên trong if, while, for

    Các biến chỉ phục vụ cho vòng lặp hoặc điều kiện nên được giới hạn phạm vi sống ngay bên trong câu lệnh đó:

    ```c++
    // Biến p chỉ tồn tại và có giá trị trong phạm vi vòng lặp while
    while (const char* p = strchr(str, '/')) {
        str = p + 1;
    }
    ```

5. Khai báo đối tượng ngoài vòng lặp

    Nếu biến cục bộ là một đối tượng (object) có chứa Constructor (hàm tạo) và Destructor (hàm hủy), việc khai báo nó bên trong một vòng lặp lớn sẽ khiến hàm tạo và hàm hủy bị gọi liên tục ở mỗi vòng lặp, gây lãng phí hiệu năng nghiêm trọng. Vì vậy nên đưa đối tượng đó ra ngoài vòng lặp.

    ```c++
    // ❌ TRƯỜNG HỢP KÉM HIỆU NĂNG (Inefficient)
    for (int i = 0; i < 1000000; ++i) {
        Foo f;              // ⚠️ Constructor và Destructor của Foo bị gọi 1.000.000 lần!
        f.DoSomething(i);
    }
    ```

    ```c++
    // ✅ TRƯỜNG HỢP TỐI ƯU (Efficient)
    Foo f;                  // ✅ Constructor và Destructor chỉ bị gọi đúng 1 lần duy nhất
    for (int i = 0; i < 1000000; ++i) {
        f.DoSomething(i);
    }
    ```

#### 2.4. Static and global variables

##### 2.4.1 Quy định về việc hủy biến
Cấm tuyệt đối việc dùng các đối tượng phức tạp (như std::string, std::map, std::unique_ptr) làm biến toàn cục hoặc biến static ngoài hàm. Bạn chỉ được phép dùng các kiểu dữ liệu có khả năng hủy tầm thường (trivially destructible — nghĩa là khi hủy, nó chẳng cần làm gì phức tạp cả, như số nguyên int, con trỏ, hoặc mảng cơ bản).    
:question: Tại sao lại có quy tắc trên?   
Các đối tượng như std::map hay std::string khi hủy phải gọi code để giải phóng bộ nhớ động. Nếu chúng nằm ở biến toàn cục, ta không kiểm soát được lúc chương trình tắt cái nào hủy trước, dễ dẫn đến việc truy cập vào vùng nhớ đã bị giải phóng.

```c++
// ❌ NGUY HIỂM: std::string có destructor phức tạp (phải dọn dẹp heap)
const std::string kFoo = "foo";  

void bar() {
    static std::map<int, int> kData; // ❌ CẤM: std::map static trong hàm
}
```

```c++
const int kNum = 10;                     // 🟢 An toàn (kiểu cơ bản)
constexpr std::array<int, 3> kArray = {1, 2, 3}; // 🟢 An toàn (constexpr đảm bảo trivial)
```

##### 2.4.2. Quy định về việc khởi tạo biến

Việc khởi tạo biến toàn cục bằng các biểu thức hằng (constexpr, constinit) luôn được hoan nghênh. Ngược lại, khởi tạo động (phải chạy một đoạn code hoặc hàm phức tạp lúc khởi động) bị hạn chế nghiêm ngặt vì không đoán trước được file nào chạy trước file nào.

Biến toàn cục sinh ra tốt nhất là để chứa hằng số cố định, chứ không nên chứa kết quả của một hàm phức tạp tính toán lúc chương trình vừa bật lên.

### 2.5. thread_local variables
Chỉ biết thread_local var là biến riếng của thread, nhưng cách sử dụng và vai trò của nó thì chưa nắm rõ được, khi cần dùng tới thì nhớ fill lại mục này sau.

### 3. Classes 
#### 3.1. Doing work in constructors
Constructor (hàm khởi tạo) là nơi để thiết lập trạng thái ban đầu cho đối tượng. Tuy nhiên, bạn không nên thực hiện các công việc phức tạp, dễ sinh lỗi, hoặc gọi các phương thức ảo (virtual methods) ngay bên trong constructor. Tránh thực hiện khởi tạo có khả năng thất bại (như mở tệp, kết nối mạng, cấp phát phức tạp) trừ khi bạn có cơ chế xử lý lỗi phù hợp (vì constructor không thể trả về mã lỗi như hàm thông thường).

Nếu việc khởi tạo có thể thất bại hoặc cần logic phức tạp:
- Giải pháp 1 (Ưu tiên): Sử dụng Factory Function (hàm tĩnh tạo đối tượng, có thể trả về lỗi hoặc std::optional/std::expected).
- Giải pháp 2: Sử dụng phương thức Init() riêng biệt (tuy nhiên, hãy tránh dùng Init() nếu đối tượng có thể rơi vào trạng thái "nửa vời" khó quản lý).

```c++
#include <iostream>

class Base {
public:
    Base() {
        // ❌ NGUY HIỂM: Gọi hàm ảo trong constructor!
        // Nếu lớp Sub kế thừa từ Base, lúc này Base đang chạy thì phần Sub chưa tồn tại.
        // Nó sẽ gọi hàm Log() của Base thay vì Sub::Log().
        Log(); 
    }

    virtual void Log() {
        std::cout << "Base log" << std::endl;
    }
};

class Sub : public Base {
public:
    Sub() : Base() {}

    void Log() override {
        std::cout << "Sub log" << std::endl;
    }
};

int main() {
    Sub s; // Kết quả in ra sẽ là "Base log" thay vì "Sub log", gây hiểu lầm lớn!
    return 0;
}
```

```c++
#include <iostream>
#include <memory>
#include <string>
#include <optional>

class NetworkConnection {
private:
    // Constructor để ở chế độ riêng tư (private) để ép người dùng phải qua Factory Function
    NetworkConnection(const std::string& ip) {
        std::cout << "Constructed object for IP: " << ip << std::endl;
    }

public:
    // Factory Function: Nơi thực hiện các bước khởi tạo có thể thất bại
    static std::optional<std::unique_ptr<NetworkConnection>> Create(const std::string& ip) {
        // 1. Kiểm tra điều kiện/kết nối trước (có thể thất bại và trả về lỗi an toàn)
        if (ip.empty() || ip == "invalid_ip") {
            std::cerr << "Error: Invalid IP address, initialization failed!" << std::endl;
            return std::nullopt; // Báo lỗi nhẹ nhàng mà không cần crash hay exception
        }

        // 2. Nếu mọi thứ OK, mới gọi constructor thông qua unique_ptr
        return std::unique_ptr<NetworkConnection>(new NetworkConnection(ip));
    }

    void SendData() {
        std::cout << "Sending data..." << std::endl;
    }
};

int main() {
    // Thử tạo kết nối với IP lỗi
    auto conn_fail = NetworkConnection::Create("invalid_ip");
    if (!conn_fail.has_value()) {
        std::cout << "Khoi tao that bai duoc xu ly an toàn.\n" << std::endl;
    }

    // Thử tạo kết nối với IP chuẩn
    auto conn_success = NetworkConnection::Create("192.168.1.1");
    if (conn_success.has_value()) {
        (*conn_success)->SendData(); // Sử dụng an toàn tuyệt đối
    }

    return 0;
}
```