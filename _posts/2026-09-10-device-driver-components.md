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
        {% include figure.liquid path="assets/img/posts/2026-09-10/fops_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/posts/2026-09-10/fops_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/posts/2026-09-10/fops_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
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
        {% include figure.liquid path="assets/img/posts/2026-09-10/file_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/posts/2026-09-10/file_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid path="assets/img/posts/2026-09-10/file_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

### 4. Struct inode 
Struct inode là gì:question:   

Struct inode (inode index) đại diện cho một tập tin thực tế trên hệ thống (file vật lý trên đĩa hoặc file thiết bị trong /dev). Mỗi file trên hệ thống chỉ có duy nhất một struct inode, bất kể có bao nhiêu chương trình đang mở nó.

Các trường thông tin trong struct inode:
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/posts/2026-09-10/inode.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

Để viết code có khả năng tương thích cao (portable) và không bị ảnh hưởng bởi các thay đổi trong tương lai của Kernel, lập trình viên không nên đọc trực tiếp inode->i_rdev, mà phải sử dụng 2 macro được Kernel cung cấp sẵn:
```c
unsigned int imajor(struct inode *inode); // Trích xuất Major Number từ inode
unsigned int iminor(struct inode *inode); // Trích xuất Minor Number từ inode
```

**Ứng dụng thực tế trong hàm open của Driver**  
Khi ứng dụng mở file thiết bị, hàm open trong driver nhận vào tham số (struct inode *inode, struct file *filp). Bạn có thể dùng iminor(inode) để biết chính xác người dùng đang mở thiết bị phụ (Minor) nào:
```c
static int scull_open(struct inode *inode, struct file *filp)
{
    unsigned int minor = iminor(inode);
    
    // Kiểm tra xem người dùng đang mở /dev/scull0, /dev/scull1 hay /dev/scull2...
    pr_info("Opening scull device with Minor number: %d\n", minor);

    return 0;
}
```

### 5. Char Device registration
**`cdev_init`**   

Kernel sử dụng cấu trúc struct cdev (định nghĩa trong <linux/cdev.h>) để quản lý các thiết bị ký tự ở bộ nhớ nội bộ. Trước khi Kernel có thể gọi bất kỳ hàm thao tác nào (read, write, open...) của driver, bạn phải khởi tạo và đăng ký cấu trúc cdev này.  
Thông thường ta sẽ nhúng cdev vào cấu trúc dữ liệu riêng của Driver, ví dụ như trong đoạn code basic device-driver trên:
```c
struct my_device {
    char *buffer;           /* Bộ đệm chứa dữ liệu */
    size_t size;            /* Kích thước dữ liệu đang lưu */
    struct cdev cdev;       /* Cấu trúc cdev của Kernel */
}
```

Để khởi tạo cdev, ta dùng hàm init:

```c
cdev_init(&my_dev_ptr->cdev, &fops);
my_dev_ptr->cdev.owner = THIS_MODULE;
```

Luôn phải gán trường owner của cdev bằng THIS_MODULE.

**`cdev_add`**   

Sau khi init xong, tiếp theo ta cần add để báo cho kernel biết là thiết bị chuẩn bị hoạt động.
```c
int cdev_add(struct cdev *dev, dev_t num, unsigned int count);
```
Các tham số bao gồm:
1. dev: Con trỏ trỏ tới cấu trúc cdev đã khởi tạo.
2. num: Số hiệu thiết bị đầu tiên (dev_t) mà thiết bị này phản hồi.
3. count: Số lượng Minor number liên quan gắn với cdev này (thường là 1).

Hàm trả về giá trị âm nếu thiết bị chưa được thêm vào hệ thống. Còn ngay khi cdev_add trả về 0, Kernel có thể lập tức gọi các hàm open, read, write của driver nếu có yêu cầu từ User-space. Do đó, chỉ gọi cdev_add khi driver và phần cứng đã được chuẩn bị hoàn toàn xong xuôi.

**`cdev_del`**   
Khi gỡ bỏ driver (trong hàm cleanup/exit), bạn cần gỡ thiết bị khỏi Kernel bằng hàm:
```c
void cdev_del(struct cdev *dev);
```

### 6. The open method   
Hàm open được gọi mỗi khi một chương trình ở User-space mở file thiết bị. Trong hầu hết các driver, hàm này đảm nhận 4 nhiệm vụ cốt lõi:
1. Kiểm tra lỗi phần cứng: Xem thiết bị có sẵn sàng không (ví dụ: máy in bị kẹt giấy, thiết bị chưa cắm...).
2. Khởi tạo thiết bị: Nếu thiết bị được mở lần đầu tiên.
3. Cập nhật con trỏ f_op: Thay đổi bảng thao tác hàm nếu cần (kỹ thuật method overriding).
4. Cấp phát & gán dữ liệu vào filp->private_data: Chuẩn bị sẵn cấu trúc dữ liệu thiết bị để các hàm read, write, release sau đó tái sử dụng dễ dàng.

Khai báo hàm open:
```c
int (*open)(struct inode *inode, struct file *filp);
```
Khi hàm open chạy, bạn có inode->i_cdev (con trỏ trỏ tới struct cdev). Nhưng cái driver thực sự cần lại là struct scull_dev (cấu trúc bao quanh chứa cdev đó).  
Giải pháp: Macro container_of, được định nghĩa trong <linux/kernel.h>, macro này cho phép tìm ngược lại địa chỉ của cấu trúc cha khi chỉ biết địa chỉ của một cấu trúc con nằm bên trong nó.   
```c
container_of(pointer, container_type, container_field);
```
Tham số: 
1. pointer: Con trỏ tới cấu trúc con đang có (ở đây là inode->i_cdev).
2. container_type: Kiểu dữ liệu của cấu trúc cha (ở đây là struct scull_dev).
3. container_field: Tên của biến con nằm trong cấu trúc cha (ở đây là trường cdev).

Ví dụ được sử dụng trong basic device-driver trên:
```c
static int my_open(struct inode *inode, struct file *filp)
{
    struct my_device *dev;

    /* Lấy cấu trúc cha chứa cdev này */
    dev = container_of(inode->i_cdev, struct my_device, cdev);
    filp->private_data = dev; /* Lưu lại để read/write dùng */

    pr_info("%s: Device opened successfully\n", DRIVER_NAME);
    return 0;
}
```

### 7. The release method
Phương thức release (trong một số driver còn được đặt tên là device_close) đóng vai trò ngược lại hoàn toàn với open. Các nhiệm vụ chính bao gồm:
1. Giải phóng bộ nhớ: Cấp phát động nào đã thực hiện trong open (gán vào filp->private_data) thì phải dùng kfree để giải phóng tại đây.
2. Tắt thiết bị: Thực hiện các thao tác hạ nguồn/tắt thiết bị phần cứng khi lần đóng cuối cùng diễn ra (shutdown hardware).

### 8. read and write
Khai báo của hàm read và write:
```c
ssize_t read(struct file *filp, char __user *buff, size_t count, loff_t *offp);
ssize_t write(struct file *filp, const char __user *buff, size_t count, loff_t *offp);
```
Giải thích các tham số:
1. filp: Con trỏ struct file đại diện cho phiên làm việc với file thiết bị.
2. buff: Con trỏ trỏ tới vùng đệm ở User-space (nơi chứa dữ liệu cần ghi, hoặc nơi nhận dữ liệu đọc về). Chú ý từ khóa gán nhãn __user.
3. count: Kích thước (số lượng bytes) dữ liệu mà User-space yêu cầu truyền tải offp: Con trỏ trỏ tới biến chỉ vị trí truy cập hiện tại trong file (loff_t).
4. Giá trị trả về (ssize_t): Số byte thực tế đã đọc/ghi thành công (nguyên không âm) hoặc số âm đại diện cho mã lỗi (ví dụ: -EFAULT).

**Tại sao kernel không được truy cập trực tiếp vào con trỏ user space (Ví dụ \*buff hoặc buff[i])**  
1. Khác biệt không gian địa chỉ (Address Space Mapping): Tùy thuộc vào kiến trúc phần cứng và cấu hình Kernel, địa chỉ vùng nhớ User-space có thể hoàn toàn không hợp lệ hoặc trỏ đến một vùng nhớ ngẫu nhiên khác khi CPU đang ở Kernel mode.
2. Nguy cơ Page Fault & Kernel Oops: Bộ nhớ User-space có thể bị đẩy ra đĩa (paged out / swapped out). Nếu Kernel truy cập trực tiếp khi trang nhớ chưa nằm trong RAM, một lỗi trang (Page Fault) sẽ xảy ra. Kernel không được phép tạo Page Fault bất ngờ theo cách này, nếu không sẽ dẫn tới lỗi sập tiến trình (Oops).
3. Bảo mật và An toàn hệ thống: Con trỏ do chương trình User-space truyền vào có thể chứa lỗi (bug) hoặc cố tình chứa địa chỉ độc hại. Nếu Kernel giải mã mù quáng, chương trình User-space có thể đọc hoặc ghi đè lên bất kỳ vùng nhớ bảo mật nào của hệ thống.

Do vậy ta cần sử dụng các hàm giúp truyền dữ liệu an toàn: copy_to_user và copy_from_user được định nghĩa trong <asm/uaccess.h>:
```
unsigned long copy_to_user(void __user *to, const void *from, unsigned long count);
unsigned long copy_from_user(void *to, const void __user *from, unsigned long count);
```
