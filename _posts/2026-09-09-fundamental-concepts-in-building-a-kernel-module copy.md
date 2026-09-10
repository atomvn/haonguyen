---
layout: post
title: Fundamental concepts in building a kernel module and hello world example
date: 2026-09-09 12:00:00
description: 
tags: device-driver
categories: 
thumbnail: assets/img/posts/2026-09-09/makefile.png 
---

:question:**Compiling a module**  
Để build kernel hay kernel modules, ta cần 2 công cụ chính đó là make và gcc. 

Đối với Linux kernel, source code của nó bao gồm hàng triệu dòng code, cùng với đó nó support nhiều kiểu phần cứng và kiến trúc chip khác nhau, do vậy hệ thống build của kernel cũng rất khủng. Hệ thống build của Linux kernel được gọi là *kbuild*, hệ thống kbuild base trên nền tảng của make và mở rộng tính năng của Makefile.

Đối với Linux kernel modules, chúng là các file dạng elf được nạp vào kernel tại runtime. 

:question:**Makefile for kernel module**  
Thực chất Makefile để build kernel modules là kbuild script. Nếu như để build kernel thì mới cần dùng tới nhiều rules, variables và definitions, còn để build modules thì không cần nhiều quá, 1 ít là đủ.  

Nhìn vào module hello_world sau:
```
#include <linux/module.h>

static int __init m_init(void)
{
	printk(KERN_ALERT "Hello, world!\n");
	return 0;
}

static void __exit m_exit(void)
{
	printk(KERN_ALERT "Bye, world!\n");
}

module_init(m_init);
module_exit(m_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Douglas Su");
MODULE_DESCRIPTION("Hello World program");
```

và Makefile của nó:

```
ifneq ($(KERNELRELEASE),)

# In kbuild context
module-objs := hello_world.o
obj-m := hello_world.o

CFLAGS_hello_world.o := -DDEBUG

else
# In normal make context
KERNELDIR ?= /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

.PHONY: modules
modules:
	$(MAKE) -C $(KERNELDIR) M=$(PWD) modules

.PHONY: clean
clean:
	$(MAKE) -C $(KERNELDIR) M=$(PWD) clean

endif
```

Ta quan tâm tới 1 số trường thông tin trong câu lệnh build:
```
$(MAKE) -C $(KERNELDIR) M=$(PWD) modules
```
- obj-m: Đây là biến đặc biệt của kbuild, nó báo với kbuild rằng chương trình của ta có 1 module cần build từ 1 object file đó là: hello_world.o.
- module-objs: Khi ta muốn link nhiều object file vào 1 module thì thứ ta cần dùng là biến XXX-objs, biến này giúp gộp tát cả các object file lại thành 1. 
- option -C, đây là standard option của make, báo rằng hãy chuyển working dir sang  thư mục ... đi. 
- option -M, option này đi kèm với path chỉ định nơi kbuild cần tìm makefile để build. Đường dẫn này phải là đường dẫn tuyệt đối.
- modules, chỉ định rằng module cần build, tuy nhiên khi build extern module, nó không bắt buộc.

:question:**Advanced makefile**  
Nếu như chỉ dùng câu lệnh build trên thì quá là rườm rà, do vậy ta cần 1 Makefile hoàn chỉnh với "double-entering" như trên để build. Cơ chế "double-entering" được hiểu như sau:

Khi người dùng type make tại thư mục hiện tại, thì trong lần đọc đầu tiên:
- Do chưa vào Kernel build system, biến KERNELRELEASE chưa được định nghĩa $\rightarrow$ make nhảy vào nhánh else.
- Nhánh else tự động lấy đường dẫn Kernel hiện tại (KDIR) và đường dẫn thư mục làm việc (PWD), sau đó thực thi lệnh:
MAKE -C KDIR M=$(PWD) modules
- Câu lệnh này chuyển hướng chương trình vào thư mục của Kernel source và gọi hệ thống build của Kernel.

Lần đọc thứ 2:
- Khi hệ thống build của Kernel (kbuild) quay ngược trở lại đọc Makefile của bạn, lúc này nó đã định nghĩa sẵn biến KERNELRELEASE.
- make nhảy vào nhánh ifneq.
- Hệ thống kbuild nhận diện được biến obj-m := hello_world.o và tiến hành biên dịch hello_world.c thành file module .ko.

:question:**Makefile targets**  
Có một số loại target mà ta thường định nghĩa trong Makefile:
1. modules: Đây là target mặc định phải có, để nếu make không tìm thấy target nào thì nó nhảy vào đây.
2. modules_install: Đây là target của kbuild, nó sẽ install module vừa được build vào trong hệ thống. Mặc định nó sẽ instal vào /lib/modules/($uname -r)/extra, còn nếu như ta muốn install vào /kmods thì ta sẽ gọi make như sau:
```
make INSTALL_MOD_PATH=/kmods` modules_install
```
3. clean: xóa tất cả các file build.
4. help: In ta 1 message 

Dive deeper into source code [here](https://github.com/atomvn/Linux-Device-Driver/tree/master/)