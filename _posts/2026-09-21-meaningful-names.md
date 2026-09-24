---
layout: post
title: meaningful names in coding
date: 2026-09-23 15:09:00
description: 
tags: clean-code
categories: 
thumbnail: assets/img/posts/2026-09-23/meaningful-names.png
featured: false
---

Blog này bàn luận về  cách đặt tên khi code.

### 1. Use intention-revealing names
Tên của biến, hàm, hoặc lớp phải trả lời được các câu hỏi sau:
1. Tại sao nó tồn tại?
2. Nó làm gì?
3. Nó được sử dụng thế nào?

**Ví dụ:**
Thay vì đặt tên biến mà phải comment
```c
int d // elapsed time in days
```

Ta nên đặt tên thể hiện rõ đối tượng và đơn vị đo:
```c
int elapsedTimeInDays;, int daysSinceCreation;, int fileAgeInDays;
```

### 2. Avoid disinformation
Tránh đặt các tên mang ý nghĩa lệch lạc, tạo ra "đại lý manh mối giả" gây hiểu lầm cho người đọc.   

Ví dụ:
- Không thêm từ List vào tên biến nếu bản chất dữ liệu không phải là danh sách (List). Thay vì accountList, nên dùng accountGroup hoặc đơn giản là accounts.
- Tránh dùng chữ cái l (L thường) và O (O hoa) làm tên biến vì chúng dễ bị nhầm với số 1 và 0.

### 3. Use pronounceable names
Tên biến, lớp, hàm phải là các từ ngữ tự nhiên, có thể đọc/phát âm được bằng ngôn ngữ thông thường. 

Ví dụ:
- Tránh gộp các chữ cái đầu: Dùng generationTimestamp thay vì genymdhms.
- Thay vì đặt tên class là DtaRcrd102, hãy đặt tên là Customer.

### 4. Use searchable names
Tên phải đủ dài và đặc trưng để có thể tìm kiếm (grep/find) dễ dàng trong toàn bộ dự án. Độ dài của tên phải tỉ lệ thuận với phạm vi (scope) của nó.

Ví dụ: 
- 1 kí tự i,j chỉ nên dùng cho biến đếm vòng lặp nội bộ trong các hàm rất ngắn.
- Thay thế các hằng số bằng các Macro có tên mô tả rõ ràng (ví dụ thay 5 bằng MAX_DAYS_PER_WEEK).

### 5. Pick one word per concept
Khi đã chọn từ nào cho một khái niệm trừu tượng thì phải giữ nhất quán từ đó trong toàn bộ dự án. Nếu dùng nhiều từ đồng nghĩa cho cùng một hành động ở các lớp kác nhau, lập trình viên sẽ mất thời gian tra cứu xem class này dùng từ nào. 

Ví dụ: 
- Không dùng fetch, retrieve, get để cùng chỉ hành động lấy dữ liệu.
- Không dùng lẫn lộn Controller, Manager, Driver.

### 6. Tên biến boolean theo dạng câu hỏi (Yes/No)
Biến kiểu đúng/sai nên được bắt đầu bằng các trợ động từ như is, has, can, should, will để người đọc lập tức hiểu biến này mang giá trị đúng/sai mà không cần xem định nghĩa.   
Ví dụ:
- Nên dùng: isActive, hasPermission, canEdit, shouldRetry, isCompleted
- Tránh dùng: isNotDisabled, vì nếu dùng !isNotDisabled gây hại não.


