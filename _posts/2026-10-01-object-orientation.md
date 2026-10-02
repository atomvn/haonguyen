---
layout: post
title: class - object oriented mindset
date: 2026-10-01 00:00:00
description: 
tags: clean-code
categories: 
thumbnail: assets/img/posts/2026-09-23/meaningful-names.png
featured: false
---

### 1. Keep classes small 
Class cần phải ngắn gọn và làm 1 việc duy nhất. Nếu số dòng code của class lớn hơn 50 ta cần phải đặt ra câu hỏi liệu class này có đang làm nhiều việc không?

### 2. Single responsibility principle (SRP)
Mỗi đơn vị phần mềm như class, hàm nên chỉ chịu trách nhiệm cho 1 việc duy nhất. Điều này giúp đơn vị đó dễ hiểu và dễ test.    
:question: Làm sao để biết class có đang làm nhiều việc hay không?   
Khi ta sửa đổi hay thêm mới 1 tính năng không liên quan tới class hiện tại mà class lại cần phải thay đổi, tức là class của ta đang làm nhiều hơn 1 việc.

### 3. Open-closed principle (OCP)

Nguyên tắc này chỉ ra rằng, mỗi đơn vị phần mềm (class, function...) nên được open cho extension và close cho modification. 

### 4. Liskov substitution principle
- Nguyên lý Liskov phát biểu rằng mọi đối tượng của lớp con (Derived class) phải có thể thay thế hoàn toàn cho đối tượng của lớp cha (Base class) mà không làm thay đổi tính đúng đắn của chương trình.
- Quan hệ kế thừa không chỉ đơn thuần là "A là một B" (IS-A) theo nghĩa ngôn ngữ hay toán học, mà phải là "A có thể thay thế hoàn toàn cho B" (IS-SUBSTITUTABLE-FOR) về mặt hành vi.

:question: Tại sao cần tuân thủ quy tắc LSP?
- Lập trình viên sử dụng lớp cha kỳ vọng các hành vi tiêu chuẩn. Nếu lớp con ghi đè làm thay đổi hoặc "xóa bỏ" hành vi đó (ví dụ: ném ra lỗi IllegalOperation), người dùng thư viện sẽ bị ngạc nhiên và khó kiểm soát code.
- Tuân thủ LSP đảm bảo bạn có thể thêm các lớp con mới mà không cần chỉnh sửa client code hay sử dụng các kỹ thuật ép kiểu/kiểm tra kiểu dữ liệu ở Runtime (như RTTI hay dynamic_cast).

Ví dụ vi phạm:
```c
#include <iostream>
#include <memory>
#include <stdexcept>

// Lớp cha: Hình chữ nhật
class Rectangle {
public:
    Rectangle(unsigned int w, unsigned int h) : width(w), height(h) {}
    virtual ~Rectangle() = default;

    virtual void setWidth(unsigned int w) { width = w; }
    virtual void setHeight(unsigned int h) { height = h; }

    unsigned int getWidth() const { return width; }
    unsigned int getHeight() const { return height; }
    unsigned long long getArea() const { return static_cast<unsigned long long>(width) * height; }

protected:
    unsigned int width;
    unsigned int height;
};

// Lớp con: Hình vuông cố gắng kế thừa Hình chữ nhật
class Square : public Rectangle {
public:
    Square(unsigned int size) : Rectangle(size, size) {}

    // Cố gắng ghi đè để đảm bảo width == height
    void setWidth(unsigned int w) override {
        width = w;
        height = w; // Tự động đổi cả height
    }

    void setHeight(unsigned int h) override {
        width = h; // Tự động đổi cả width
        height = h;
    }
};

// Client code xử lý thông qua con trỏ Lớp cha Rectangle
void processRectangle(Rectangle& r) {
    r.setWidth(10);
    r.setHeight(5);

    // KỲ VỌNG: Diện tích phải là 10 * 5 = 50
    std::cout << "Expected Area: 50, Actual Area: " << r.getArea() << std::endl;
}

int main() {
    Rectangle rect(2, 3);
    processRectangle(rect); // Output: Expected Area: 50, Actual Area: 50 (Đúng)

    Square sq(5);
    processRectangle(sq);   // Output: Expected Area: 50, Actual Area: 25 ❌ (SAI!)
    // Bị lỗi vì setHeight(5) đã âm thầm đổi luôn width thành 5!
    return 0;
}
```

Refactor đoạn code trên để tuân thủ LSP:
```c
#include <iostream>
#include <memory>
#include <vector>

// Interface chung ở cấp độ trừu tượng cao hơn
class Shape {
public:
    virtual ~Shape() = default;
    virtual unsigned long long getArea() const = 0;
};

// Lớp Hình chữ nhật độc lập
class Rectangle : public Shape {
public:
    Rectangle(unsigned int w, unsigned int h) : width(w), height(h) {}

    void setWidth(unsigned int w) { width = w; }
    void setHeight(unsigned int h) { height = h; }

    unsigned long long getArea() const override {
        return static_cast<unsigned long long>(width) * height;
    }

private:
    unsigned int width;
    unsigned int height;
};

// Lớp Hình vuông độc lập
class Square : public Shape {
public:
    Square(unsigned int side) : sideLength(side) {}

    void setSide(unsigned int side) { sideLength = side; }

    unsigned long long getArea() const override {
        return static_cast<unsigned long long>(sideLength) * sideLength;
    }

private:
    unsigned int sideLength;
};

// Client code hoạt động dựa trên Interface Shape
void printArea(const Shape& shape) {
    std::cout << "Area: " << shape.getArea() << std::endl;
}

int main() {
    Rectangle rect(10, 5);
    Square sq(5);

    printArea(rect); // Output: Area: 50 (Hoạt động hoàn hảo)
    printArea(sq);   // Output: Area: 25 (Hoạt động hoàn hảo)

    return 0;
}
```

### 5. Favor composition over inheritance
Tức là vẫn với ví dụ Square và Rectangle, nếu như Square ở đây cần một số implimentation của Rectangle thì ta sẽ ưu tiên việc Square sẽ kế thừa trực tiếp từ Shape tuy nhiên sẽ tạo 1 instance của Rectangle để lấy các implementation của Rectangle trong square, đảm bảo nguyên tắc DRY.   

Ở đây người ta nói có 2 cách để tái sử dụng code, 1 là kế thừa (white box reuse), 2 là composition hoặc delegation, tức là tạo instance trong class và gọi các implementation của nó (block box reuse).

Hình ảnh mô tả:
<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/posts/2026-10-01/composition-over-inheritance.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

Đoạn code ví dụ biểu chưng cho nguyên tắc trên:
```c
class Square : public Shape {
public:
    Square() {
        impl.setEdges(5, 5);
    }
    explicit Square(const unsigned int edgeLength) {
        impl.setEdges(edgeLength, edgeLength);
    }
    void setEdge (const unsigned int length) {
        impl.setEdges(length, length);
    }
    virtual void moveTo(const Point& newCenterPoint) override {
        impl.moveTo(newCenterPoint);
    }
    virtual void show() override {
        impl.show();
    }
    virtual void hide() override {
        impl.hide();
    }
    unsigned lomg longgetArea() const {
        return impl.getArea();
    }
private:
    Rectangle impl;
};
```

### 6. Interface segregation principle (ISP)
Ở đây người ta nói về việc cần tách nhỏ interface ra, tránh interface too "fat".

Ví dụ thay vì để 1 interface như này:
```c
class Bird {
public:
    virtual ~Bird() = default;
    virtual void fly() = 0;
    virtual void eat() = 0;
    virtual void run() = 0;
    virtual void tweet() = 0;
};
```
Nếu có class penguin kế thừa interface trên thì gây ra confusion vì penguin không thể override lại method fly().
```c
class Penguin : public Bird {
    public:
    virtual void fly() override {
    // ???
    }
    //...
};
```

Do đó, khi refactor lại ta cần tách chúng ra thành 3 interfaces:
```c
class Lifeform {
public:
    virtual void eat() = 0;
    virtual void move() = 0;
};

class Flyable {
public:
    virtual void fly() = 0;
};

class Audible {
public:
    virtual void makeSound() = 0;
};
```
Và cho class kế thừa nhiều interface:

```c
class Sparrow : public Lifeform, public Flyable, public Audible {
//...
};
class Penguin : public Lifeform, public Audible {
//...
};
```

### 7. Acyclic dependency principle
:exclamation: Nguyên tắc này nói về việc ta nên tránh circular dependency, tránh viết các đoạn code như bên dưới. Cụ thể phương pháp tránh circular dependency thế nào xem các principle sau sẽ thấy.

```c
#ifndef CUSTOMER_H_
#define CUSTOMER_H_
#include "Account.h"
class Customer {
// ...
private:
    Account customerAccount;
};
#endif

#ifndef ACCOUNT_H_
#define ACCOUNT_H_
#include "Customer.h"
class Account {
private:
    Customer owner;
};
#endif
```

### 8. Dependency inversion principle (DIP)
Nguyên tắc để tránh circular dependency. Về cơ bản ở đây ta sẽ tạo ra 1 lớp interface là Owner và cho thằng Account kế thừa nó, và thằng Cusomer sẽ khởi tạo instance của Account.

### 9. Dont talk to strangers
