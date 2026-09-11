---
layout: post
title: linux dma engine
date: 2026-09-10 16:00:00
description: 
tags: linux
categories: 
featured: false
---

Ở blog này, thứ ta cùng tìm hiểu là công cụ DMA Engine của Linux.

### 1. Tổng quan về phần cứng của bộ điều khiển Slave DMA (DMA Controller)
Đầu tiên ta cần nắm một số khái niệm:
1. Channel: Hình dung ram như là nhà kho, còn thiết bị ngoại vi là cửa hàng bán lẻ. Yêu cầu ở đây là vận chuyển hàng từ nhà kho ra cửa hàng thì channel là công nhân thực hiện việc bốc vác.
2. Request line (DRQ): Hình dung request line là 1 chuông báo đặt ở cửa hàng, khi nào hết hàng thì nhân viên chỉ cần bấm chuông này, DMA sẽ nhận được thông báo yêu cầu chuyển hàng.  

Channel và request hoạt động độc lập với nhau, 1 channel có thể phục vụ nhiều request.

Các tham số tối thiểu cần có để config 1 DMA transfer:
1. `Source address`: Con trỏ vùng nhớ nguồn: Cho DMA Controller biết dữ liệu sẽ được đọc ra từ đâu (ví dụ: Địa chỉ RAM vật lý trong bộ đệm nguồn, hoặc địa chỉ thanh ghi Data/FIFO của ngoại vi).
2. `Destination address`: Con trỏ vùng nhớ đích: Cho DMA Controller biết dữ liệu sẽ được ghi vào đâu (ví dụ: Địa chỉ RAM vật lý trong bộ đệm đích, hoặc địa chỉ thanh ghi FIFO của thiết bị như UART/Audio/SPI).
3. `Cờ tăng địa chỉ (Source / Destination Address Increment)`: Cho biết sau mỗi lần đọc/ghi một byte (hoặc word), con trỏ địa chỉ có tự động tăng lên $1$ bước hay giữ nguyên:
    - RAM $\rightarrow$ RAM: Cả Nguồn và Đích đều phải tăng để đọc/ghi qua các ô nhớ tiếp theo.
    - RAM $\rightarrow$ Ngoại vi (ví dụ: FIFO): Địa chỉ RAM phải tăng, nhưng địa chỉ thanh ghi ngoại vi phải giữ nguyên (vì dữ liệu luôn được đẩy vào cùng một cổng FIFO, tức là FIFO ăn dữ liệu rồi đẩy ra).
4. `Kích thước Truyền Tổng (Transfer Size / Length)`: 
    - Tổng dung lượng (số lượng Byte hoặc Word) của toàn bộ khối dữ liệu cần chuyển đi trong lần giao dịch này.
    - DMA Controller sẽ dùng giá trị này làm bộ đếm ngược; mỗi lần truyền thành công sẽ giảm dần về $0$ để kết thúc lệnh hoặc kích hoạt ngắt (Interrupt).
5. `Độ rộng Đường truyền (Transfer Width / Bus Width)`: Kích thước của mỗi đơn vị dữ liệu được ghi/đọc trong một chu kỳ bus đơn lẻ (ví dụ: 8-bit/1 byte, 16-bit/2 bytes, 32-bit/4 bytes, hoặc 64-bit).
6. `Kích thước Nhóm Truyền (Burst Size)`: 
    - Số lượng giao dịch đơn lẻ (single transfers) mà DMA Controller được phép gộp lại thành một gói lớn để truy xuất bộ nhớ RAM một lần.
    - Giúp tối ưu hóa băng thông Bus RAM thay vì phải gửi từng lệnh đọc/ghi nhỏ lẻ.
7. `Kênh DMA & Tín hiệu Yêu cầu (DMA Channel & Request Line / DRQ Signal)`: 
    - Channel: Chọn/Chỉ định một Kênh (Channel) phần cứng rảnh rỗi sẽ thực thi việc sao chép.
    - Request Line (DRQ): Chỉ định ID của đường tín hiệu phần cứng nối từ thiết bị ngoại vi tới DMA Controller, giúp DMA biết tín hiệu xin truyền dữ liệu này là của thiết bị nào (UART, SPI, hay I2S...).

### 2. DMA Engine API guide

Tổng quan thì mô hình thực thi DMA sẽ tuân theo 5 bước:
$$\text{1. Xin cấp phát Channel} \longrightarrow \text{2. Cấu hình tham số} \longrightarrow \text{3. Chuẩn bị Descriptor} \longrightarrow \text{4. Submit vào Hàng chờ} \longrightarrow \text{5. Issue Pending (Bắt đầu chạy)}$$