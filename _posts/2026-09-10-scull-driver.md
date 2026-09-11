---
layout: post
title: scull device driver
date: 2026-09-10 16:00:00
description: 
tags: device-driver
categories: 
featured: false
---

Trước tiên [đây](https://github.com/atomvn/Linux-Device-Driver/tree/master/eg_03_scull_basic) là mã nguồn của driver scull!

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

### 1. scull_open
```c
int scull_open(struct inode *inode, struct file *filp)
{
	struct scull_dev *dev;

	pr_debug("%s() is invoked\n", __FUNCTION__);

	dev = container_of(inode->i_cdev, struct scull_dev, cdev);
	filp->private_data = dev;

	if ((filp->f_flags & O_ACCMODE) == O_WRONLY) {
		if (mutex_lock_interruptible(&dev->mutex))
			return -ERESTARTSYS;
		scull_trim(dev);
		mutex_unlock(&dev->mutex);
	}

	return 0;
}
```

Nhiệm vụ của hàm scull_open:

1. Ghi nhật ký Debug (Logging)
    ```c
    pr_debug("%s() is invoked\n", __FUNCTION__);
    ```
    - Sử dụng pr_debug để in ra dòng thông báo debug khi hàm được gọi.
    - __FUNCTION__ (hoặc __func__) là hằng số của trình biên dịch chứa tên hàm hiện tại (scull_open).
2. Tìm cấu trúc quản lý thiết bị bằng container_of
    ```c
    dev = container_of(inode->i_cdev, struct scull_dev, cdev);
    filp->private_data = dev;
    ```
    - filp->private_data = dev;: Lưu con trỏ dev vừa tìm được vào trường private_data của struct file. Vì filp sẽ được truyền qua lại giữa các hàm scull_read, scull_write, scull_release, việc gắn sẵn dev vào đây giúp các hàm sau truy cập thẳng vào dữ liệu thiết bị mà không cần gọi lại container_of.
3. Xử lý logic khi mở file với chế độ chỉ ghi (O_WRONLY)
    ```c
    if ((filp->f_flags & O_ACCMODE) == O_WRONLY) {
    if (mutex_lock_interruptible(&dev->mutex))
        return -ERESTARTSYS;
    scull_trim(dev);
    mutex_unlock(&dev->mutex);
    }
    ```

    - filp->f_flags & O_ACCMODE: Mask O_ACCMODE được dùng để trích xuất các cờ truy cập (như O_RDONLY, O_WRONLY, O_RDWR).
    - == O_WRONLY: Kiểm tra xem file có phải đang được mở để chỉ ghi hay không. Theo thiết kế của driver scull, khi mở ở chế độ ghi, toàn bộ dữ liệu hiện có trên thiết bị sẽ bị xóa sạch (tương tự hành vi khi mở một file thông thường với cờ O_TRUNC).
    - mutex_lock_interruptible(&dev->mutex): Khóa mutex để đảm bảo chỉ có 1 tiến trình được thao tác trên vùng nhớ của dev tại một thời điểm (tránh race condition khi có nhiều tiến trình cùng mở/xóa thiết bị).
    - Hàm trả về giá trị khác 0 nếu tiến trình bị ngắt bởi một tín hiệu (signal). Khi đó hàm trả về -ERESTARTSYS để kernel biết rằng lời gọi hệ thống nên được khởi động lại sau khi xử lý xong tín hiệu.
    - scull_trim(dev);: Gọi hàm giải phóng toàn bộ các vùng nhớ/phân đoạn dữ liệu (quantums & items) đang lưu giữ thông tin của thiết bị.
    - mutex_unlock(&dev->mutex);: Giải phóng khóa mutex sau khi đã xóa sạch dữ liệu.