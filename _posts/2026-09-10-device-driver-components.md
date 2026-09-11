---
layout: post
title: Components inside a device driver
date: 2026-09-10 15:09:00
description: 
tags: device-driver
categories: 
featured: false
---

1 basic device driver sẽ trông như sau:

```c++
#include <linux/module.h>
#include <linux/init.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/uaccess.h>
#include <linux/slab.h>

#define DRIVER_NAME "my_demo_dev"
#define BUF_SIZE 1024

/* [THÀNH PHẦN 6]: Cấu trúc quản lý dữ liệu & trạng thái thiết bị 
 * Thông thường người ta sẽ dùng 1 struct để quản lý 1 thiết bị.
 */
struct my_device {
    char *buffer;           /* Bộ đệm chứa dữ liệu */
    size_t size;            /* Kích thước dữ liệu đang lưu */
    struct cdev cdev;       /* Cấu trúc cdev của Kernel */
};

/* Biến toàn cục quản lý thiết bị */
static dev_t dev_num;                  /* [THÀNH PHẦN 1]: Major & Minor Number */
static struct my_device *my_dev_ptr;  /* Con trỏ quản lý thiết bị nội bộ */

/* [THÀNH PHẦN 4]: Các Phương thức Thao tác File */
/* Phương thức open, giúp mở file */
static int my_open(struct inode *inode, struct file *filp)
{
    struct my_device *dev;

    /* Lấy cấu trúc cha chứa cdev này */
    dev = container_of(inode->i_cdev, struct my_device, cdev);
    filp->private_data = dev; /* Lưu lại để read/write dùng */

    pr_info("%s: Device opened successfully\n", DRIVER_NAME);
    return 0;
}

/* Phương thức release, giống như close, đây là phương thức giúp đóng file */
static int my_release(struct inode *inode, struct file *filp)
{
    pr_info("%s: Device closed\n", DRIVER_NAME);
    return 0;
}

/* Phương thức read, giúp đọc file */
static ssize_t my_read(struct file *filp, char __user *buf, size_t count, loff_t *offp)
{
    struct my_device *dev = filp->private_data;
    size_t bytes_to_copy;

    if (*offp >= dev->size)
        return 0; /* Hết dữ liệu (EOF) */

    bytes_to_copy = min(count, (size_t)(dev->size - *offp));

    /* [THÀNH PHẦN 5]: Truyền dữ liệu an toàn về User-space */
    if (copy_to_user(buf, dev->buffer + *offp, bytes_to_copy) != 0) {
        return -EFAULT;
    }

    *offp += bytes_to_copy;
    return bytes_to_copy;
}

/* Phương thức write, giúp ghi file */
static ssize_t my_write(struct file *filp, const char __user *buf, size_t count, loff_t *offp)
{
    struct my_device *dev = filp->private_data;
    size_t bytes_to_copy = min(count, (size_t)(BUF_SIZE - 1));

    /* [THÀNH PHẦN 5]: Đọc dữ liệu từ User-space 
     * Khi đọc dữ liệu từ user-space, ta không giải trực tiếp con trỏ vì một số lí do
     * Vì vậy ta cần dùng hàm copy_from_user là hàm safe copy, vì nó sẽ verify con trỏ trước 
     * khi thao tác
     */
    if (copy_from_user(dev->buffer, buf, bytes_to_copy) != 0) {
        return -EFAULT;
    }

    dev->buffer[bytes_to_copy] = '\0';
    dev->size = bytes_to_copy;
    *offp += bytes_to_copy;

    return bytes_to_copy;
}

/* [THÀNH PHẦN 3]: Struct file_operations
 * Đây là thành phần bắt buộc phải có, muốn biết nó là gì, xem phía dưới
 */
static struct file_operations fops = {
    .owner   = THIS_MODULE,
    .open    = my_open,
    .release = my_release,
    .read    = my_read,
    .write   = my_write,
};

/* Hàm đầu vào của module */
static int __init my_driver_init(void)
{
    int ret;

    /* 1. Xin cấp phát Major & Minor number động */
    ret = alloc_chrdev_region(&dev_num, 0, 1, DRIVER_NAME);
    if (ret < 0) return ret;

    /* 2. Cấp phát bộ nhớ cho struct thiết bị */
    my_dev_ptr = kmalloc(sizeof(struct my_device), GFP_KERNEL);
    if (!my_dev_ptr) {
        unregister_chrdev_region(dev_num, 1);
        return -ENOMEM;
    }

    my_dev_ptr->buffer = kmalloc(BUF_SIZE, GFP_KERNEL);
    my_dev_ptr->size = 0;

    /* === [THÀNH PHẦN 2]: Khởi tạo & Đăng ký cdev với Kernel === */
    cdev_init(&my_dev_ptr->cdev, &fops);
    my_dev_ptr->cdev.owner = THIS_MODULE;

    ret = cdev_add(&my_dev_ptr->cdev, dev_num, 1);
    if (ret < 0) {
        kfree(my_dev_ptr->buffer);
        kfree(my_dev_ptr);
        unregister_chrdev_region(dev_num, 1);
        return ret;
    }

    pr_info("%s: Loaded with Major %d, Minor %d\n", 
            DRIVER_NAME, MAJOR(dev_num), MINOR(dev_num));
    return 0;
}

/* Hàm được gọi khi module đóng */
static void __exit my_driver_exit(void)
{
    /* Hủy kích hoạt cdev, giải phóng bộ nhớ và trả số hiệu thiết bị */
    cdev_del(&my_dev_ptr->cdev);
    kfree(my_dev_ptr->buffer);
    kfree(my_dev_ptr);
    unregister_chrdev_region(dev_num, 1);

    pr_info("%s: Unloaded successfully\n", DRIVER_NAME);
}

/* Gán các hàm my_init, my)exit vào các hàm init, exit của module
 * Để khi module init hay exit thì nó sẽ gọi các hàm my_init, my_exit */
module_init(my_driver_init);
module_exit(my_driver_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Driver Engineer");
MODULE_DESCRIPTION("A Standard Character Device Driver Example");
```

Sau khi xem qua 1 driver basic thì bây giờ ta bắt đầu tìm hiểu các thành phần trong đó là gì.

### 1. Major and minor number
Khi ta gõ câu lệnh `ls -l /dev` thì ta có thể nhận được kết quả như sau:
```shell
crw-rw-rw- 1 root root 1, 3 Apr 11 2002 null
crw------- 1 root root 10, 1 Apr 11 2002 psaux
crw------- 1 root root 4, 1 Oct 28 03:04 tty1
crw-rw-rw- 1 root tty 4, 64 Apr 11 2002 ttys0
crw-rw---- 1 root uucp 4, 65 Apr 11 2002 ttyS1
crw--w---- 1 vcsa tty 7, 1 Apr 11 2002 vcs1
crw--w---- 1 vcsa tty 7, 129 Apr 11 2002 vcsa1
crw-rw-rw- 1 root root 1, 5 Apr 11 2002 zer
```

Ở kết quả trên, ta thấy có các cặp số được ngăn cách nhau bởi dấu `,` , đó chính là major và minor number. 

Vậy major number là gì:question:  
Major number xác định driver chịu trách nhiệm quản lý thiết bị đó, ví dụ như ở trên ta thấy thiết bị /dev/null và /dev/zero đều được quản lý bới thiết bị 1, trong khi virtual console và serial terminals được quản lý bởi driver 4.

Còn về minor number thì sao:question:  
Minor number xác định thiết bị cụ thể hoặc kệnh cụ thể do driver đó quản lý (ví dụ: 1 driver quản lý 4 cổng kết nối thì nó sẽ có 1 major và 4 minor number từ 0->3)

Vậy trong src code, major và minor number được biểu diễn ra sao:question:   
Kiểu dữ liệu dev_t được định nghĩa trong header file <linux/types.h> được sử dụng để dữ số hiệu thiết bị, major and minor number. dev_t là kiểu dữ liệu 32 bit với 12 bit được dành cho major và 20 bit được dành cho minor number. Khi muốn đọc giá trị của major hay minor number ta phải sử dụng các macros được định nghĩa trong <linux/kdev_t.h>:
```c
MAJOR(dev_t dev);
MINOR(dev_t dev);
```

Nếu ta đã có major và minor number mà muốn đưa chúng vào 1 biến dev_t thì ta có thể dùng:
```c
MKDEV(int major, int minor);
```

:exclamation:Tiếp theo ta sẽ tìm hiểu cách cấp phát major và minor number.  
Ở đây ta sẽ bỏ qua cách cấp phát tĩnh (Tức là khi ta đã biết major nào còn trống, và muốn xin cấp phát cho thiết bị của ta), mà chỉ nói về cấp phát động, dùng khi chưa có major và muốn kernel tự động cấp phát.

```c
int alloc_chrdev_region(dev_t *dev,unsigned int firstminor, unsiged int count, char* name);
```
Các tham số của hàm trên bao gồm:
1. dev: Tham số đầu ra (Output-only). Sau khi hàm chạy thành công, biến chỉ số dev_t này sẽ lưu số hiệu thiết bị đầu tiên được cấp (chứa Major tự động + Minor đầu tiên).
2. firstminor: Minor number đầu tiên bạn muốn bắt đầu sử dụng (thường truyền 0).
3. count: Số lượng Minor number liên tiếp muốn xin cấp.
4. name: Tên thiết bị đăng ký trong /proc/devices.

Hàm trả về 0 nếu thành công và số âm nếu thất bại.

:exclamation:Giải phóng device number.  
Sau khi sử dụng xong, ta bắt buộc phải trả lại dải số device number đã được cấp phát để cho các driver khác có thể tái sử dụng, khi muốn giải phóng ta dùng hàm:
```c
void unregister_chrdev_region(dev_t first, unsigned int count);
```

Tham số:
1. first: device number đã xin cấp phát trước đó
2. count: số lượng minor number cần trả lại, phải bằng count lúc xin

### 2. Struct file_operations 
Struct file_operations là gì, tại sao lại cần có struct này trong device driver của ta:question:   
Để trả lời cho câu hỏi trên, ta cùng tìm hiểu vai trò của struct file_operations:
1. Sau khi xin cấp số hiệu thiết bị (dev_t), Kernel vẫn chưa biết khi ứng dụng gọi read(), write(), hay open() thì code nào trong driver sẽ chạy. Cấu trúc file_operations chính là tập hợp các con trỏ hàm (function pointers) đảm nhận nhiệm vụ này. Ta sẽ gán các con trỏ hàm trong struct này vào các hàm my_open, my_read, my_write...

2. Cấu trúc này hoặc con trỏ trỏ tới nó thường được gọi tắt là fops.

3. Giá trị NULL: Nếu driver không cài đặt một hàm nào đó, con trỏ hàm tương ứng sẽ để NULL. Khi ứng dụng gọi system call tương ứng, Kernel sẽ tự xử lý mặc định (thường là trả về lỗi hoặc bỏ qua tùy hàm).

4. Chú thích __user: Xuất hiện ở các tham số con trỏ (ví dụ: char __user *buf). Đây là đánh dấu chỉ ra rằng đây là địa chỉ thuộc bộ nhớ User-space, không được phép giải con trỏ (dereference) trực tiếp trong Kernel mà phải dùng các hàm hỗ trợ như copy_to_user() hay copy_from_user().

Chi tiết các trường thông tin trong struct file_operations:
<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-09-10.fops_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-09-10.fops_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-09-10.fops_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

Ví dụ khởi tạo instance của struct file_operations cho driver scull:
```
struct file_operations scull_fops = {
    .owner   = THIS_MODULE,
    .llseek  = scull_llseek,
    .read    = scull_read,
    .write   = scull_write,
    .ioctl   = scull_ioctl,
    .open    = scull_open,
    .release = scull_release,
}
```
### 3. Struct file
Struct file là gì:question:   
1. Struct file này là thằng đại diện cho 1 file đang được mở, tức là mỗi khi 1 tiến trình ở user space mà gọi open() để mở 1 file (hoặc thiết bị trong /dev), thì Kernel sẽ tạo ra 1 instance của struct file trong kernel space.
2. Cấu trúc này tồn tại từ lúc file được mở cho đến khi tất cả các bản sao của nó bị đóng hoàn toàn (close()). Khi không còn tiến trình nào dùng tới, Kernel sẽ giải phóng cấu trúc này.
3. Trong Kernel source code, con trỏ trỏ tới struct file thường được gọi là filp (File Pointer) để tránh nhầm lẫn với chính bản thân cấu trúc file.

Các trường thông tin trong struct file:
<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-09-10.file_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-09-10.file_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/2026-09-10.file_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
