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
Không thêm từ List vào tên biến nếu bản chất dữ liệu không phải là danh sách (List). Thay vì accountList, nên dùng accountGroup hoặc đơn giản là accounts.