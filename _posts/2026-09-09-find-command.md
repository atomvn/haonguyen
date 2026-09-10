---
layout: post
title: How to use find command in Linux 
date: 2026-09-09 12:00:00
description: 
tags: linux
categories: 
thumbnail: assets/img/posts/2026-09-09/find.jpg
---

:question:Câu lệnh find tìm kiếm trong hệ thống file, tìm kiếm các file theo yêu cầu của người dùng: tên, size, thời gian sửa đổi...

**Syntax câu lệnh find**  
```
find [path] [expression] [action]
```

**Tìm kiếm file theo tên**  
Mặc định khi tìm kiếm với expression là -name thì find sẽ tìm case-sensitive. Nếu không nhớ rõ tên file là gì thì có thể find case-insensitive bằng -iname:
```
find . -name "config.yaml" // Case-sensitive
find . -iname "NETWORK" // Case-insensitive
```

**Tìm kiếm nhiều file dùng wildcards**  
```
find /var/log -name "*.log"
```

**Tìm kiếm và xóa file**  
Có thể thêm cờ -delete vào cuối để tìm và xóa file.
```
find /tmp -name "*.tmp" -delete
```

**Tìm kiếm file theo kiểu file (Thư mục), size, và quyền truy cập**

**Tìm kiếm theo size**  
Để tìm kiếm file có size lớn hơn 100MB ta thêm cờ +100M, nhỏ hơn 100MB ta thêm cờ -100M và cuối câu lệnh file với expression là -size.
```
find /var -size +100M
find /var -size -100M
```

**Tìm kiếm theo quyền truy cập**  
Đề tìm các file có quyền 777:
```
find /var/www -perm 777
```

**Tìm theo timestamps để track thời điểm sửa file**  
Để tìm các file được sửa đổi trong 1 số ngày trước thời điểm hiện tại ta dùng experssion -mtime, còn 1 số phút ta dùng expression -mmin, ví dụ câu lệnh sau tìm kiếm các file được chỉnh sửa trong vòng 1 ngày trước:
```
find /etc -mtime -1
```

**Tìm file theo người và nhóm sở hữu**  
```
find /home -user john_doe
```
Câu lệnh này giúp trả về tất cả các object trả về bởi UID hoặc user name đó.