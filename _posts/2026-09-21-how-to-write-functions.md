---
layout: post
title: how to write a function
date: 2026-09-23 15:09:00
description: 
tags: clean-code
categories: 
thumbnail: assets/img/posts/2026-09-23/meaningful-names.png
featured: false
---

Function là thứ cốt yêu của code, vì vậy bạn phải biết cách tạo ra các function clean, dễ maintain và dễ mở rộng.

### 1. Keep functions small
Hàm phải cực kì nhỏ, chỉ nên dài từ 3 tới 5 dòng và hiếm khi vượt quá 20 dòng. Mức độ indentation chỉ nên từ 1 đến 2 cấp.
Khi hàm nhỏ, chương trình sẽ dễ đọc, dễ hiểu, dễ viết Unit Test và dễ bảo trì. 

Ví dụ:
- Các khối lệnh if, else, while, for nên chỉ dài 1 dòng và dòng đó là 1 lời gọi hàm.
- Đặt tên cho hàm được gọi bên trong các khối lệnh thật rõ ràng để làm tăng giá trị giải thích cho code.

### 2. Do one thing

Một hàm chỉ nên thực hiện duy nhất một chức năng, bởi vì làm nhiều việc sẽ khiến hàm bị phồng to, khó đặt tên, chứa nhiều mức độ trừu tượng rất khó maintain và dễ phát sinh lỗi khi sửa đổi.
:question: Vậy làm sao để biết hàm đó đang chỉ làm đúng 1 việc?  
- Nếu hàm chỉ gồm các bước thực hiện nằm ngay dưới 1 cấp trừu tượng so với tên hàm thì hàm đó đang làm 1 việc.
- Nếu ta có thể tách một đoạn code trong hàm ra thành 1 hàm mới với lời gọi hàm không chỉ đơn thuần mô tả lại cách cài đặt của nó, thì nên tách ngay.
- Nếu hàm bị chia thành nhiều phần như Declarations, Initializations, Processing thì hàm đó đang làm nhiều việc.

Ví dụ: Giả sử ta cần viết một hàm xử lý quy trình thanh toán đơn hàng processOrder, code xấu sẽ trông như sau:
```c
// ❌ HÀM LÀM QUÁ NHIỀU VIỆC
void processOrder(Order& order, const std::string& userEmail) {
    // Đoạn 1: Declarations & Initializations (Khai báo & Khởi tạo)
    double totalAmount = 0.0;
    
    // Đoạn 2: Validation (Mức trừu tượng thấp - Duyệt mảng và kiểm tra từng item)
    if (order.items.empty()) {
        std::cerr << "Order has no items!" << std::endl;
        return;
    }
    for (const auto& item : order.items) {
        if (item.quantity <= 0) {
            std::cerr << "Invalid quantity for item: " << item.id << std::endl;
            return;
        }
    }

    // Đoạn 3: Processing / Calculation (Mức trừu tượng thấp - Tính tổng tiền, thuế, giảm giá)
    for (const auto& item : order.items) {
        totalAmount += item.price * item.quantity;
    }
    if (totalAmount > 100.0) {
        totalAmount *= 0.9; // Giảm giá 10%
    }
    totalAmount += totalAmount * 0.08; // Cộng thuế 8%
    order.totalAmount = totalAmount;

    // Đoạn 4: Payment processing (Giao tiếp với cổng thanh toán)
    bool paymentSuccess = PaymentGateway::charge(userEmail, order.totalAmount);
    if (!paymentSuccess) {
        order.status = OrderStatus::FAILED;
        return;
    }
    order.status = OrderStatus::PAID;

    // Đoạn 5: Notification (Tạo nội dung email và gửi thông báo)
    std::string emailBody = "Cảm ơn bạn đã mua hàng. Tổng tiền: " + std::to_string(order.totalAmount);
    EmailService::send(userEmail, "Xác nhận đơn hàng", emailBody);
}
```

Thử suy nghĩ, ta có thể tách đoạn tính tiền ra thành hàm calculateTotal(order) hoặc đoạn kiểm tra ra validate(order) mà tên hàm mới nghe rất tự nhiên và có ý nghĩa nghiệp vụ, không hề lặp lại tên của hàm cũ. Đầu tiên ta tạo các hàm con ở mức độ trừu tượng thấp hơn:

```c
// 1. Chỉ làm 1 việc: Kiểm tra tính hợp lệ của đơn hàng
bool isValidOrder(const Order& order) {
    if (order.items.empty()) return false;
    for (const auto& item : order.items) {
        if (item.quantity <= 0) return false;
    }
    return true;
}

// 2. Chỉ làm 1 việc: Tính tổng chi phí (Bao gồm giảm giá và thuế)
double calculateTotalAmount(const Order& order) {
    double total = 0.0;
    for (const auto& item : order.items) {
        total += item.price * item.quantity;
    }
    if (total > 100.0) {
        total *= 0.9; // Giảm giá
    }
    return total * 1.08; // Bao gồm thuế
}

// 3. Chỉ làm 1 việc: Thực hiện giao dịch thanh toán qua Gateway
bool executePayment(Order& order, const std::string& userEmail) {
    bool success = PaymentGateway::charge(userEmail, order.totalAmount);
    order.status = success ? OrderStatus::PAID : OrderStatus::FAILED;
    return success;
}

// 4. Chỉ làm 1 việc: Gửi email thông báo đơn hàng
void sendOrderConfirmationEmail(const std::string& userEmail, double amount) {
    std::string emailBody = "Cảm ơn bạn đã mua hàng. Tổng tiền: " + std::to_string(amount);
    EmailService::send(userEmail, "Xác nhận đơn hàng", emailBody);
}
```

Sau đó tạo hàm chính ở cấp độ trừu tượng cao nhất:
```c
// ✅ HÀM CHỈ LÀM 1 VIỆC: Điều phối toàn bộ quy trình xử lý đơn hàng
void processOrder(Order& order, const std::string& userEmail) {
    if (!isValidOrder(order)) {
        return;
    }

    order.totalAmount = calculateTotalAmount(order);

    if (executePayment(order, userEmail)) {
        sendOrderConfirmationEmail(userEmail, order.totalAmount);
    }
}
```