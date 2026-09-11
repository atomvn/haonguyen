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

$$\text{scull_dev} \longrightarrow \text{struct scull_qset (ListNode)} \longrightarrow \text{Array of Pointers (Qset)} \longrightarrow \text{Data Buffers (Quantum)}$$

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

### 2. scull_release
```c
int scull_release(struct inode *inode, struct file *filp)
{
	pr_debug("%s() is invoked\n", __FUNCTION__);
	return 0;
}
```
Ở đây khi User space gọi `close(fd)` thì hàm release này sẽ được gọi, nó đơn giản trả về 0.

### 3. scull_read
```c
ssize_t scull_read(struct file *filp, char __user *buff, size_t count, loff_t *f_pos)
{
	struct scull_dev *dev = filp->private_data;
	struct scull_block *pblock = NULL;
	loff_t retval = -ENOMEM;
	loff_t tblock = 0, toffset = 0;
	struct list_head *plist = NULL;

	pr_debug("%s() is invoked\n", __FUNCTION__);

	tblock = *f_pos / SCULL_BLOCK_SIZE;
	toffset = *f_pos % SCULL_BLOCK_SIZE;

	if (mutex_lock_interruptible(&dev->mutex))
	    return -ERESTARTSYS;

	if (tblock + 1 > dev->block_counter) {
		retval = 0;
		goto end_of_file;
	}

	plist = &dev->block_list;
	for (int i = 0; i < tblock + 1; ++i) {
		plist = plist->next;
	}

	pblock = list_entry(plist, struct scull_block, block_list);
	if (toffset >= pblock->offset) {
		retval = 0;
		goto end_of_file;
	}

	if (count > pblock->offset)
		count = pblock->offset;

	if (copy_to_user(buff, pblock->data, count)) {
		retval = -EFAULT;
		goto cpy_user_error;
	}

	retval = count;
	*f_pos += count;

end_of_file:
cpy_user_error:
	pr_debug("RD pos = %lld, block = %lld, offset = %lld, read %lu bytes\n",
	       *f_pos, tblock, toffset, count);

	mutex_unlock(&dev->mutex);
	return retval;
}
```
Nhiệm vụ của hàm scull_read:

1. Lấy thông tin và tính toán vị trí đọc
    ```c
    struct scull_dev *dev = filp->private_data;
    struct scull_block *pblock = NULL;
    loff_t retval = -ENOMEM;
    loff_t tblock = 0, toffset = 0;
    struct list_head *plist = NULL;

    tblock = *f_pos / SCULL_BLOCK_SIZE;
    toffset = *f_pos % SCULL_BLOCK_SIZE;
    ```
    - filp->private_data: Lấy lại con trỏ struct scull_dev đã lưu từ hàm open().
    - tblock: Thứ tự chỉ số của khối (block) cần truy cập trong danh sách liên kết.
    - toffset: Vị trí lệch (offset) tương đối bên trong khối đó.

2. Bật mutex và kiểm tra giới hạn EOF
    ```c
    if (mutex_lock_interruptible(&dev->mutex))
    return -ERESTARTSYS;

    if (tblock + 1 > dev->block_counter) {
        retval = 0;
        goto end_of_file;
    }
    ```
    - Kiểm tra xem chỉ số block cần đọc (tblock) có vượt quá tổng số khối hiện có trong thiết bị (dev->block_counter) hay không.
    - Nếu vượt quá, tức là đã đọc hết file (EOF) $\rightarrow$ Đặt retval = 0 và nhảy tới nhãn kết thúc.

3. Duyệt danh sách liên kết đến đúng Block
    ```c
    plist = &dev->block_list;
    for (int i = 0; i < tblock + 1; ++i) {
        plist = plist->next;
    }

    pblock = list_entry(plist, struct scull_block, block_list);
    ```
    - Duyệt danh sách liên kết vòng dev->block_list qua tblock + 1 bước để tìm đúng nút (node).
    - list_entry(...): Kỹ thuật macro tiêu chuẩn của Kernel để lấy con trỏ của cấu trúc bao ngoài struct scull_block từ con trỏ plist.

4. Kiểm tra dữ liệu khả dụng trong Block
    ```c
    if (toffset >= pblock->offset) {
        retval = 0;
        goto end_of_file;
    }

    if (count > pblock->offset)
        count = pblock->offset;
    ```
    - pblock->offset: Lưu số lượng byte thực tế đang chứa trong block hiện tại.
    - Nếu vị trí lệch toffset nằm ngoài phạm vi dữ liệu có sẵn $\rightarrow$ Trả về 0 (EOF).
    - Nếu số byte User-space yêu cầu đọc (count) lớn hơn dung lượng dữ liệu hiện có, điều chỉnh count chỉ đọc tối đa lượng dữ liệu khả dụng.

5. Sao chép dữ liệu an toàn về User-space (copy_to_user)
    ```c
    if (copy_to_user(buff, pblock->data, count)) {
        retval = -EFAULT;
        goto cpy_user_error;
    }

    retval = count;
    *f_pos += count;
    ```
    - copy_to_user(...): Chuyển an toàn count byte từ bộ nhớ Kernel (pblock->data) sang con trỏ User-space (buff).
    - Nếu thất bại (trả về khác 0) $\rightarrow$ Gán mã lỗi -EFAULT (Bad Address).
    - Nếu thành công: retval = count: Trả về số byte thực tế đã đọc thành công., *f_pos += count: Cập nhật vị trí con trỏ file để chuẩn bị cho lần đọc tiếp theo.

### 4. scull_write
```c
ssize_t scull_write(struct file *filp, const char __user *buff, size_t count,
		    loff_t *f_pos)
{
	struct scull_dev *dev = filp->private_data;
	struct scull_block *pblock = NULL;
	loff_t retval = -ENOMEM;
	loff_t tblock = 0, toffset = 0;

	pr_debug("%s() is invoked\n", __FUNCTION__);

	tblock = *f_pos / SCULL_BLOCK_SIZE;
	toffset = *f_pos % SCULL_BLOCK_SIZE;

	if (mutex_lock_interruptible(&dev->mutex))
		return -ERESTARTSYS;

	/*
	 * For simplicity, we write one block each write request.
	 */
	while (tblock + 1 > dev->block_counter) {
		if (!(pblock = kmalloc(sizeof(struct scull_block), GFP_KERNEL)))
			goto malloc_error;
		memset(pblock, 0, sizeof(struct scull_block));
		INIT_LIST_HEAD(&pblock->block_list);
		list_add_tail(&pblock->block_list, &dev->block_list);
		dev->block_counter++;
	}
	pblock = list_last_entry(&dev->block_list, struct scull_block, block_list);

	if (count > SCULL_BLOCK_SIZE - toffset)
		count = SCULL_BLOCK_SIZE - toffset;

	if (copy_from_user(pblock->data + toffset, buff, count)) {
		retval = -EFAULT;
		goto cpy_user_error;
	}
	
	retval = count;
	pblock->offset += count;
	*f_pos += count;

malloc_error:
cpy_user_error:
	pr_debug("WR pos = %lld, block = %lld, offset = %lld, write %lu bytes\n",
	       *f_pos, tblock, toffset, count);

	mutex_unlock(&dev->mutex);
	return retval;
}
```

Các nhiệm vụ của hàm scull_write:
1. Tính toán vị trí ghi & Đồng bộ hóa
    ```c
    tblock = *f_pos / SCULL_BLOCK_SIZE;
    toffset = *f_pos % SCULL_BLOCK_SIZE;

    if (mutex_lock_interruptible(&dev->mutex))
    return -ERESTARTSYS;
    ```

    - tblock & toffset: Dựa trên vị trí con trỏ file hiện tại (*f_pos), driver tính toán dữ liệu sẽ rơi vào khối thứ mấy (tblock) và độ lệch bao nhiêu byte bên trong khối đó (toffset).
    - mutex_lock_interruptible(&dev->mutex): Khóa Mutex để đảm bảo an toàn đa luồng (thread-safety), ngăn chặn hai tiến trình cùng ghi vào bộ nhớ driver gây xung đột (race condition).

2. Cấp phát bộ nhớ động
    ```c
    /*
    * For simplicity, we write one block each write request.
    */
    while (tblock + 1 > dev->block_counter) {
        if (!(pblock = kmalloc(sizeof(struct scull_block), GFP_KERNEL)))
            goto malloc_error;
        memset(pblock, 0, sizeof(struct scull_block));
        INIT_LIST_HEAD(&pblock->block_list);
        list_add_tail(&pblock->block_list, &dev->block_list);
        dev->block_counter++;
    }
    pblock = list_last_entry(&dev->block_list, struct scull_block, block_list);
    ```

    - Kiểm tra nhu cầu cấp phát: Nếu chỉ số khối cần ghi (tblock + 1) vượt quá số lượng khối hiện có (dev->block_counter), vòng lặp while sẽ chạy để bổ sung các khối RAM mới.
    - kmalloc(..., GFP_KERNEL): Cấp phát bộ nhớ RAM trong Kernel space cho cấu trúc struct scull_block. Cờ GFP_KERNEL cho phép tiến trình tạm ngủ nếu RAM chưa sẵn sàng.
    - memset & INIT_LIST_HEAD: Xóa trống nội bộ block mới và khởi tạo con trỏ danh sách liên kết.
    - list_add_tail(...): Đưa block mới vừa tạo vào cuối danh sách liên kết dev->block_list.
    - list_last_entry(...): Lấy con trỏ pblock trỏ tới khối vừa tạo ở cuối danh sách để chuẩn bị ghi.

3. Giới hạn kích thước ghi một lần
    ```c
    if (count > SCULL_BLOCK_SIZE - toffset)
        count = SCULL_BLOCK_SIZE - toffset;
    ```

    - Để đơn giản hóa logic xử lý, hàm này quy định mỗi lần ghi chỉ xử lý dữ liệu vừa đủ cho 1 block.
    - Nếu số byte User-space yêu cầu ghi (count) vượt quá khoảng trống còn lại của block hiện tại (SCULL_BLOCK_SIZE - toffset), driver sẽ cắt nhỏ count lại. Lượng dữ liệu còn dở dang sẽ được ứng dụng ghi tiếp ở lượt gọi write() tiếp theo.

4. Copy dữ liệu an toàn từ User-space (copy_from_user)
    ```c
    if (copy_from_user(pblock->data + toffset, buff, count)) {
        retval = -EFAULT;
        goto cpy_user_error;
    }

    retval = count;
    pblock->offset += count;
    *f_pos += count;
    ```
    - copy_from_user(...): Sao chép an toàn count bytes từ vùng nhớ User-space (buff) vào vùng nhớ Kernel (pblock->data + toffset).
    - Xử lý lỗi: Nếu copy thất bại, gán retval = -EFAULT (Bad address) và nhảy đến nhãn xử lý lỗi.
    - Cập nhật trạng thái:
        - retval = count: Trả về số byte thực tế đã ghi thành công.
        - pblock->offset += count: Cập nhật dung lượng dữ liệu đang chứa trong block này.
        - *f_pos += count: Cập nhật con trỏ vị trí file để lượt ghi tiếp theo bắt đầu ở ngay sau dữ liệu vừa ghi.