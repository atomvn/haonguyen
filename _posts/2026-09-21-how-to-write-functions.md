---
layout: post
title: how to write a function
date: 2026-09-24 15:09:00
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

### 3. One level of abstraction per function
Khi viết hàm ta chia thành 3 cấp độ trừu tượng:
1. Cấp cao: `getHtml()`
2. Cấp trung: `PathParser.render(pagePath)`
3. Cấp thấp: `append("\n")`

Quy tắc flow từ trên xuống: Mỗi hàm nên được nối tiếp bởi các hàm ở cấp độ trừu tượng ngay bên dưới nó (Để làm A, ta làm B, để làm B, ta ...)

Ví dụ:

```c
// ❌ TRỘN LẪN NHIỀU CẤP ĐỘ TRỪU TƯỢNG
std::string renderRadarReport(RadarData& radarData) {
    std::string html = "";
    
    // Cấp cao: Lấy HTML cơ bản của báo cáo
    html += radarData.getBaseHtml(); 

    // Cấp trung: Thao tác parse đường dẫn và lấy tên file cấu hình
    std::string configPath = "/etc/radar/config.xml";
    std::string configName = PathParser::render(configPath);
    html += "<div class='config'>" + configName + "</div>";

    // Cấp thấp (Chi tiết cài đặt tỉ mỉ): Thao tác xử lý chuỗi trực tiếp, định dạng thẻ HTML và ký tự xuống dòng
    html += "<table border='1'>\n";
    for (const auto& target : radarData.getTargets()) {
        html += "  <tr>\n";
        html += "    <td>Target ID: " + std::to_string(target.id) + "</td>\n";
        html += "    <td>Distance: " + std::to_string(target.distance) + "m</td>\n";
        html += "  </tr>\n";
    }
    html += "</table>\n";
    html += "\n"; // Thao tác cộng ký tự xuống dòng rất cấp thấp

    return html;
}
```

Chúng ta tách hàm sao cho mỗi hàm chỉ chứa các câu lệnh ở cùng một cấp độ trừu tượng, đồng thời sắp xếp code theo luồng đọc từ trên xuống dưới (đọc giống các đoạn văn TO / ĐỂ...).

```c
// =================================================================
// CẤP ĐỘ 0 (Cao nhất): Ý đồ tổng thể
// TO renderRadarReport... (ĐỂ tạo báo cáo radar)
// =================================================================
std::string renderRadarReport(RadarData& radarData) {
    std::string html = "";
    html += renderHeader(radarData);
    html += renderConfigSection();
    html += renderTargetsTable(radarData.getTargets());
    return html;
}

// =================================================================
// CẤP ĐỘ 1: Các thành phần của báo cáo (Một cấp dưới Cấp 0)
// TO renderHeader... (ĐỂ tạo phần đầu trang)
// =================================================================
std::string renderHeader(RadarData& radarData) {
    return radarData.getBaseHtml();
}

// TO renderConfigSection... (ĐỂ tạo phần cấu hình)
std::string renderConfigSection() {
    std::string configName = PathParser::render("/etc/radar/config.xml");
    return "<div class='config'>" + configName + "</div>";
}

// TO renderTargetsTable... (ĐỂ tạo bảng danh sách mục tiêu)
std::string renderTargetsTable(const std::vector<Target>& targets) {
    std::string tableHtml = "<table border='1'>\n";
    for (const auto& target : targets) {
        tableHtml += renderTargetRow(target);
    }
    tableHtml += "</table>\n";
    return tableHtml;
}

// =================================================================
// CẤP ĐỘ 2 (Thấp nhất): Chi tiết cài đặt từng dòng
// TO renderTargetRow... (ĐỂ tạo từng dòng dữ liệu trong bảng)
// =================================================================
std::string renderTargetRow(const Target& target) {
    std::string row = "  <tr>\n";
    row += "    <td>Target ID: " + std::to_string(target.id) + "</td>\n";
    row += "    <td>Distance: " + std::to_string(target.distance) + "m</td>\n";
    row += "  </tr>\n";
    return row;
}
```

### 4. Bọc cấu trúc Switch / If-else phức tạp
Cấu trúc switch (hoặc chuỗi if/else dài) bản chất là làm $N$ việc. Cần ẩn switch xuống tầng thấp nhất và không lặp lại nó. switch vi phạm nguyên tắc SRP (Single Responsibility) và OCP (Open/Closed) vì mỗi khi thêm kiểu dữ liệu mới, bạn phải sửa lại switch ở khắp nơi trong hệ thống.

Ví dụ:
Giả sử bạn có nhiều hình thức thanh toán: Thẻ tín dụng (Credit Card), Ví Momo, và PayPal. Đoạn code sau xấu vì rải khác if-else, switch ở nhiều nơi.
```c
enum class PaymentMethod {
    CREDIT_CARD,
    MOMO,
    PAYPAL
};

// ❌ SWITCH VI PHẠM SRP VÀ OCP
class PaymentProcessor {
public:
    // Hàm 1: Tính phí giao dịch
    double calculateFee(PaymentMethod method, double amount) {
        switch (method) {
            case PaymentMethod::CREDIT_CARD:
                return amount * 0.02; // Phí 2%
            case PaymentMethod::MOMO:
                return amount * 0.01; // Phí 1%
            case PaymentMethod::PAYPAL:
                return amount * 0.03 + 0.3; // Phí 3% + $0.3
            default:
                throw std::invalid_argument("Phương thức không hợp lệ");
        }
    }

    // Hàm 2: Xử lý trừ tiền
    bool processPayment(PaymentMethod method, double amount) {
        switch (method) {
            case PaymentMethod::CREDIT_CARD:
                std::cout << "Kết nối Cổng thanh toán Thẻ Tín Dụng...\n";
                return true;
            case PaymentMethod::MOMO:
                std::cout << "Tạo mã QR và gọi API Momo...\n";
                return true;
            case PaymentMethod::PAYPAL:
                std::cout << "Chuyển hướng sang Gateway PayPal...\n";
                return true;
            default:
                return false;
        }
    }
    
    // Nếu tương lai có thêm hàm refund(), generateInvoice()... lại phải thêm switch!
};
```

Để giải quyết vấn đề trên:
1. Tạo Interface IPaymentStrategy định nghĩa các hành vi thanh toán.
2 Dùng Tính đa hình (Polymorphism) cho từng hình thức thanh toán.
3. Bọc câu lệnh switch duy nhất vào một Factory.

Bước 1: Định nghĩa Interface và các Class cụ thể (Polymorphism)
```c
// Interface chung cho tất cả hình thức thanh toán
class IPaymentStrategy {
public:
    virtual ~IPaymentStrategy() = default;
    virtual double calculateFee(double amount) const = 0;
    virtual bool process(double amount) = 0;
};

// 1. Thanh toán Thẻ Tín Dụng
class CreditCardPayment : public IPaymentStrategy {
public:
    double calculateFee(double amount) const override {
        return amount * 0.02;
    }
    bool process(double amount) override {
        std::cout << "Kết nối Cổng thanh toán Thẻ Tín Dụng để trừ $" << amount << "\n";
        return true;
    }
};

// 2. Thanh toán Ví Momo
class MomoPayment : public IPaymentStrategy {
public:
    double calculateFee(double amount) const override {
        return amount * 0.01;
    }
    bool process(double amount) override {
        std::cout << "Tạo mã QR và gọi API Momo để trừ $" << amount << "\n";
        return true;
    }
};

// 3. Thanh toán PayPal
class PaypalPayment : public IPaymentStrategy {
public:
    double calculateFee(double amount) const override {
        return amount * 0.03 + 0.3;
    }
    bool process(double amount) override {
        std::cout << "Chuyển hướng sang Gateway PayPal để trừ $" << amount << "\n";
        return true;
    }
};
```

Bước 2: Khởi tạo duy nhất qua Abstract Factory (Ẩn switch xuống tầng thấp)
```c
// Lớp Factory chứa câu lệnh switch DUY NHẤT của toàn hệ thống
class PaymentFactory {
public:
    static std::unique_ptr<IPaymentStrategy> createPayment(PaymentMethod method) {
        switch (method) {
            case PaymentMethod::CREDIT_CARD:
                return std::make_unique<CreditCardPayment>();
            case PaymentMethod::MOMO:
                return std::make_unique<MomoPayment>();
            case PaymentMethod::PAYPAL:
                return std::make_unique<PaypalPayment>();
            default:
                throw std::invalid_argument("Phương thức thanh toán không được hỗ trợ");
        }
    }
};
```

Bước 3: Client Code xử lý giao dịch (Sạch sẽ, hoàn toàn KHÔNG còn switch)
```c
// Hàm thanh toán ở cấp độ ứng dụng
void checkout(PaymentMethod method, double orderAmount) {
    // 1. Tạo đối tượng thích hợp qua Factory (Switch chỉ chạy 1 lần ẩn ở đây)
    std::unique_ptr<IPaymentStrategy> payment = PaymentFactory::createPayment(method);

    // 2. Tính phí và thực hiện giao dịch hoàn toàn bằng Đa hình
    double fee = payment->calculateFee(orderAmount);
    double total = orderAmount + fee;

    std::cout << "Tổng tiền thanh toán (bao gồm phí $" << fee << "): $" << total << "\n";
    
    if (payment->process(total)) {
        std::cout << "Giao dịch thành công!\n";
    }
}
```
