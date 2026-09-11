---
layout: post
title: scull device driver
date: 2026-09-10 15:00:00
description: 
tags: device-driver
categories: 
featured: false
---

Trước tiên [đây](https://github.com/atomvn/Linux-Device-Driver/tree/master/eg_03_scull_basic) là mã nguồn của driver scull!
---
Trong bài viết này, ta cùng tìm hiểu về device driver của thằng scull(Simple 
Character Utility for Loading Localities), đây là 1 virtual character device. 
Một thiết bị scull hoạt động như một vùng đệm dữ liệu tuần hoàn. Khi bạn ghi 
một chuỗi ký tự vào /dev/scull0, nó sẽ lưu chuỗi đó vào RAM; khi bạn đọc từ 
/dev/scull0, nó sẽ trả lại đúng chuỗi đó.
<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/posts/2026-09-10/scull_layout.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption">
    Kiến trúc của scull.
</div>

Để quản lý vùng nhớ này hiệu quả mà không bị lãng phí RAM, scull sử dụng mô hình Danh sách liên kết (Linked List) kết hợp Mảng hai chiều:

$$\text{scull\_dev} \longrightarrow \text{struct scull\_qset (ListNode)} \longrightarrow \text{Array of Pointers (Qset)} \longrightarrow \text{Data Buffers (Quantum)}$$

Định nghĩa về các thành phần của scull:
1. Quantum (Lượng tử): Là một khối bộ nhớ nhỏ nhất để chứa dữ liệu (mặc định là 4000 bytes).
2. Quantum Set (Qset): Là một mảng chứa các con trỏ trỏ tới từng Quantum (mặc định chứa 1000 con trỏ).
3. Danh sách liên kết (scull_qset): Khi dữ liệu ghi vào vượt quá kích thước của một Quantum Set, scull sẽ dùng kmalloc để tạo thêm một nút (scull_qset) mới và nối vào danh sách.

