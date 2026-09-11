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
$$\text{1. Xin cấp phát Channel} \longrightarrow \text{2. Cấu hình tham số} \longrightarrow \text{3. Chuẩn bị Descriptor} \longrightarrow \text{4. Submit vào hàng chờ} \longrightarrow \text{5. Issue Pending (Bắt đầu chạy)}$$

#### 1. Cấp phát Kênh DMA (Allocate a DMA Slave channel)  
Khác với giao tiếp RAM-to-RAM có thể dùng bất kỳ kênh nào, Slave DMA yêu cầu kênh từ một bộ điều khiển cụ thể (hoặc một kênh phần cứng nhất định nối tới ngoại vi đó).  
```c
struct dma_chan *dma_request_chan(struct device *dev, const char *name);
```
- Hàm sẽ dựa vào Device Tree (DT), ACPI hoặc bảng ánh xạ dma_slave_map để tìm kênh DMA tương ứng với thiết bị dev theo tên name (ví dụ: "tx" hoặc "rx").  
Kênh đã được cấp phát sẽ thuộc quyền sở hữu riêng của Client driver đó cho đến khi gọi hàm dma_release_channel().

- Lấy 1 ví dụ để hiểu cách dma_request_chan hoạt động và tương tác với device.

- Ví dụ ta có device tree định nghĩa 1 thiết bị uart và 1 bộ điều khiển dma như sau:
```
/* Khai báo bộ điều khiển DMA của chip */
dma0: dma-controller@40000000 {
    compatible = "arm,pl330";
    #dma-cells = <1>;
    ...
};

/* Khai báo thiết bị UART0 */
uart0: serial@40001000 {
    compatible = "ns16550a";
    reg = <0x40001000 0x100>;
    
    /* 
     * Khai báo UART0 được nối với dma0:
     * - Kênh truyền (TX) dùng request line số 2
     * - Kênh nhận (RX) dùng request line số 3
     */
    dmas = <&dma0 2>, <&dma0 3>;
    
    /* Đặt tên định danh cho 2 kênh này */
    dma-names = "tx", "rx";
};
```

và đoạn code C xin kênh DMA tên tx:

```c
#include <linux/dmaengine.h>

static int my_uart_probe(struct platform_device *pdev)
{
    struct device *dev = &pdev->dev;
    struct dma_chan *tx_chan;

    /* 
     * Bước 1: Gọi hàm xin cấp phát kênh DMA "tx"
     * - dev: trỏ tới thiết bị uart0
     * - "tx": tên kênh đã đặt trong Device Tree (dma-names = "tx")
     */
    tx_chan = dma_request_chan(dev, "tx");

    /* Kiểm tra xem có lấy được kênh không */
    if (IS_ERR(tx_chan)) {
        dev_err(dev, "Không thể xin kênh DMA TX! Mã lỗi: %ld\n", PTR_ERR(tx_chan));
        return PTR_ERR(tx_chan);
    }

    dev_info(dev, "Đã xin thành công kênh DMA TX: %s\n", dma_chan_name(tx_chan));

    /* Lưu lại con trỏ tx_chan để dùng cho các bước truyền dữ liệu sau này */
    my_uart_dev->tx_chan = tx_chan;

    return 0;
}
```

#### 2. Cấu hình các tham số phần cứng
Trước khi truyền, driver phải thiết lập các tham số kỹ thuật như độ rộng bus, burst size, địa chỉ FIFO ngoại vi...

```c
int dmaengine_slave_config(struct dma_chan *chan, struct dma_slave_config *config);
```
- Đưa thông tin từ cấu trúc struct dma_slave_config vào kênh DMA.
- Trường direction trong dma_slave_config đang dần bị loại bỏ vì nó trùng lặp với tham số hướng truyền dữ liệu khi tạo descriptor ở Bước 3.

Tiếp tục ví dụ ở phần 1:
```c
#include <linux/dmaengine.h>

int configure_uart_tx_dma(struct my_uart_device *uart_dev)
{
    struct dma_slave_config config;
    int ret;

    /* 1. Xóa sạch bộ nhớ của struct config để tránh rác */
    memset(&config, 0, sizeof(config));

    /* 2. Thiết lập địa chỉ đích (Destination - FIFO của UART) */
    /* uart_dev->fifo_phy_addr là địa chỉ vật lý thanh ghi Data của UART, ví dụ 0x40001004 */
    config.dst_addr = uart_dev->fifo_phy_addr;

    /* 3. Thiết lập độ rộng bus truyền dữ liệu (Bus Width) */
    /* Cổng UART truyền theo từng ký tự (1 byte) nên dùng 1_BYTE */
    config.dst_addr_width = DMA_SLAVE_BUSWIDTH_1_BYTE;

    /* 4. Thiết lập độ dài Burst (Burst Size) */
    /* Mức chứa của FIFO UART trước khi cần nạp tiếp, ví dụ: truyền 1 byte mỗi lượt request */
    config.dst_maxburst = 1;

    /* 
     * Lưu ý về trường direction:
     * Theo tài liệu, dù struct có trường config.direction nhưng API hiện đại 
     * khuyến nghị bỏ qua hoặc không phụ thuộc vào nó nữa. Hướng truyền (RAM -> DEV) 
     * sẽ do bước 3 (Prep Descriptor) đảm nhận!
     */

    /* 5. Nạp cấu hình vào kênh DMA */
    ret = dmaengine_slave_config(uart_dev->tx_chan, &config);
    if (ret) {
        dev_err(uart_dev->dev, "Cấu hình DMA Slave thất bại: %d\n", ret);
        return ret;
    }

    dev_info(uart_dev->dev, "Cấu hình DMA Slave cho UART TX thành công!\n");
    return 0;
}
```

#### 3. Lấy descriptor cho giao dịch 
Descriptor đại diện cho một giao dịch DMA. Tùy thuộc vào mô hình dữ liệu, dmaengine cung cấp nhiều loại hàm chuẩn bị (prepare APIs):
1. dmaengine_prep_slave_sg(): Truyền một danh sách các vùng nhớ phân tán (Scatter-Gather list) từ/đến ngoại vi.
2. dmaengine_prep_config_sg(): Tương tự như slave_sg, nhưng cho phép truyền kèm dma_slave_config để tránh phải gọi dmaengine_slave_config() mỗi khi đổi burst size hay địa chỉ FIFO.
3. dmaengine_prep_peripheral_dma_vec(): Truyền danh sách bộ đệm dùng mảng cấu trúc dma_vec thay vì scatterlist.
4. dmaengine_prep_dma_cyclic(): Truyền tuần hoàn (Cyclic DMA) theo vòng lặp không dừng cho tới khi bị hủy thủ công. Rất phổ biến trong Audio Subsystem (ALSA/ASoC) để phát âm thanh liên tục.
5. dmaengine_prep_interleaved_dma(): Dùng cho các kiểu dữ liệu đan xen phức tạp (phù hợp cho cả Mem2Mem và Slave DMA).

Trước khi gọi dmaengine_prep_slave_sg(), client driver bắt buộc phải map danh sách scatterlist với DMA device của kênh, việc gọi dma_map_sg() giúp:
- Chuyển đổi toàn bộ địa chỉ ảo trong danh sách scatterlist thành Địa chỉ DMA (Bus Address) để bộ điều khiển DMA có thể đọc/ghi trực tiếp.
- Kiểm tra và vô hiệu hóa/đẩy cache (Cache Flushing/Invalidation) để đảm bảo CPU và DMA không đọc nhầm dữ liệu cũ còn sót lại trong CPU Cache.
- Nếu hệ thống có IOMMU (Input-Output MMU), dma_map_sg() sẽ cấu hình IOMMU để gộp các trang RAM phân tán thành một dải địa chỉ liên tục cho DMA.

```c
struct device *dma_dev = dmaengine_get_dma_device(chan);
nr_sg = dma_map_sg(dma_dev, sgl, sg_len);
if (nr_sg == 0)
    /* Xử lý lỗi mapping */
desc = dmaengine_prep_slave_sg(chan, sgl, nr_sg, direction, flags);
```

Cùng xem xét ví dụ cho từng loại API lấy descriptor giao dịch:
- dmaengine_prep_slave_sg() — Dùng cho giao dịch truyền dữ liệu tiêu chuẩn (UART, SPI, SDIO)
```c
#include <linux/dmaengine.h>
#include <linux/dma-mapping.h>
#include <linux/scatterlist.h>

int send_sg_dma(struct my_uart_dev *uart, struct scatterlist *sgl, unsigned int sg_len)
{
    struct dma_chan *chan = uart->tx_chan;
    struct device *dma_dev = dmaengine_get_dma_device(chan);
    struct dma_async_tx_descriptor *desc;
    int nr_sg;

    /* 1. MAP danh sách scatterlist sang địa chỉ Bus DMA */
    nr_sg = dma_map_sg(dma_dev, sgl, sg_len, DMA_TO_DEVICE);
    if (nr_sg == 0)
        return -ENOMEM;

    /* 2. Tạo Descriptor từ danh sách đã map */
    desc = dmaengine_prep_slave_sg(
        chan,
        sgl,
        nr_sg,                  /* Số lượng phần tử đã map thành công */
        DMA_MEM_TO_DEV,         /* Hướng truyền: RAM -> Ngoại vi */
        DMA_PREP_INTERRUPT | DMA_CTRL_ACK /* Báo ngắt khi xong & Tự do giải phóng desc */
    );

    if (!desc) {
        dma_unmap_sg(dma_dev, sgl, sg_len, DMA_TO_DEVICE);
        return -EINVAL;
    }

    /* 3. Đăng ký Callback hoàn thành */
    desc->callback = my_uart_dma_tx_callback;
    desc->callback_param = uart;

    /* 4. Submit và Bấm máy kích hoạt */
    dmaengine_submit(desc);
    dma_async_issue_pending(chan);

    return 0;
}
```

- dmaengine_prep_dma_cyclic() — Dùng cho Audio Driver (ALSA / Sound)
```c
#include <sound/pcm.h>
#include <linux/dmaengine.h>

int start_audio_cyclic_dma(struct my_pcm_runtime *pcm)
{
    struct dma_chan *chan = pcm->dma_chan;
    struct dma_async_tx_descriptor *desc;

    /* 
     * Khai báo Ring Buffer âm thanh:
     * - pcm->buf_addr: Địa chỉ DMA vật lý của Ring Buffer
     * - pcm->buf_len:  Tổng kích thước Ring Buffer (ví dụ: 64 KB)
     * - pcm->period_len: Kích thước 1 chu kỳ bắn ngắt (ví dụ: 8 KB)
     */
    desc = dmaengine_prep_dma_cyclic(
        chan,
        pcm->buf_addr,
        pcm->buf_len,
        pcm->period_len,
        DMA_MEM_TO_DEV,
        DMA_PREP_INTERRUPT
    );

    if (!desc)
        return -ENOMEM;

    /* Callback này sẽ được gọi SAU MỖI PERIOD_LEN (mỗi khi truyền hết 8KB) */
    desc->callback = my_alsa_period_elapsed_callback;
    desc->callback_param = pcm;

    dmaengine_submit(desc);
    dma_async_issue_pending(chan);

    return 0;
}
```

- dmaengine_prep_config_sg() — Đổi địa chỉ FIFO / Burst size trực tiếp mà không cần re-config
```c
int send_config_sg_dma(struct my_spi_dev *spi, struct scatterlist *sgl, int sg_len)
{
    struct dma_chan *chan = spi->tx_chan;
    struct device *dma_dev = dmaengine_get_dma_device(chan);
    struct dma_slave_config config = {};
    struct dma_async_tx_descriptor *desc;
    int nr_sg;

    /* Đổi cấu hình FIFO dành riêng cho gói tin này */
    config.dst_addr = spi->fifo_ch2_phys_addr; /* Chọn FIFO Kênh 2 */
    config.dst_addr_width = DMA_SLAVE_BUSWIDTH_2_BYTES;
    config.dst_maxburst = 4;

    nr_sg = dma_map_sg(dma_dev, sgl, sg_len, DMA_TO_DEVICE);

    /* Vừa prep Descriptor vừa đính kèm struct dma_slave_config mới */
    desc = dmaengine_prep_config_sg(
        chan,
        sgl,
        nr_sg,
        DMA_MEM_TO_DEV,
        DMA_PREP_INTERRUPT,
        &config /* Cấu hình trực tiếp ở đây, KHÔNG cần gọi dmaengine_slave_config() */
    );

    if (!desc) {
        dma_unmap_sg(dma_dev, sgl, sg_len, DMA_TO_DEVICE);
        return -EINVAL;
    }

    dmaengine_submit(desc);
    dma_async_issue_pending(chan);

    return 0;
}
```

- dmaengine_prep_peripheral_dma_vec() — Truyền bộ đệm dùng mảng dma_vec (Giao diện đơn giản hơn scatterlist)
```c
#include <linux/dmaengine.h>

int send_dma_vec(struct dma_chan *chan, dma_addr_t phy_addr1, dma_addr_t phy_addr2)
{
    struct dma_async_tx_descriptor *desc;
    
    /* Mảng 2 bộ đệm đơn giản */
    struct dma_vec vecs[2] = {
        { .addr = phy_addr1, .len = 1024 },
        { .addr = phy_addr2, .len = 2048 },
    };

    desc = dmaengine_prep_peripheral_dma_vec(
        chan,
        vecs,
        2,                  /* Số lượng phần tử mảng */
        DMA_MEM_TO_DEV,
        DMA_PREP_INTERRUPT
    );

    if (!desc)
        return -EINVAL;

    dmaengine_submit(desc);
    dma_async_issue_pending(chan);

    return 0;
}
```

- dmaengine_prep_interleaved_dma() — Truyền ma trận / Mẫu dữ liệu 2D phức tạp (Video Processing)

```c
#include <linux/dmaengine.h>

int send_2d_image_stripe(struct dma_chan *chan, dma_addr_t src_buf, dma_addr_t dst_fifo)
{
    struct dma_interleaved_template xt = {};
    struct dma_async_tx_descriptor *desc;

    xt.src_start = src_buf;
    xt.dst_start = dst_fifo;
    xt.dir = DMA_MEM_TO_DEV;
    xt.numf = 1080;                /* Số dòng (Khung hình 1080p) */
    xt.frame_size = 1;             /* 1 khung cấu trúc bên dưới */

    /* Cấu hình 1 dòng ảnh */
    xt.sgl[0].size = 1920;         /* Đọc 1920 byte dữ liệu Pixel */
    xt.sgl[0].icg = 640;           /* Nhảy qua (skip) 640 byte lề (Padding) rồi mới đọc dòng tiếp theo */

    desc = dmaengine_prep_interleaved_dma(chan, &xt, DMA_PREP_INTERRUPT);

    if (!desc)
        return -EINVAL;

    dmaengine_submit(desc);
    dma_async_issue_pending(chan);

    return 0;
}
```

#### 4. Submit giao dịch
Sau khi khởi tạo descriptor và đăng ký hàm hoàn hoàn tất (callback), driver đưa descriptor vào hàng chờ xử lý (pending queue).
```c
dma_cookie_t dmaengine_submit(struct dma_async_tx_descriptor *desc);
```
- Trả về: Trả về một mã cookie (dùng để tra cứu tiến độ truyền nếu cần).
- Lưu ý sở hữu:Ngay sau khi gọi dmaengine_submit(), con trỏ desc thuộc về quản lý của DMA Engine. Client driver không được tự ý truy cập hay thao tác trên con trỏ desc đó nữa.
- Chưa kích hoạt: Hàm này CHƯA kích hoạt DMA chạy, nó mới chỉ đẩy công việc vào hàng chờ!

#### 5. Kích hoạt truyền và chờ Callback
```c
void dma_async_issue_pending(struct dma_chan *chan);
```
- Nếu kênh DMA đang rảnh, giao dịch đầu tiên sẽ được bấm máy chạy ngay lập tức. các giao dịch sau sẽ được xếp hàng.
- Khi mỗi giao dịch hoàn thành, ngắt phần cứng bắn ra $\rightarrow$ Tasklet chạy $\rightarrow$ Gọi hàm Callback thông báo cho Client Driver $\rightarrow$ Tự động chuyển sang giao dịch tiếp theo trong queue.

### 3. Ví dụ cụ thể
Với device uart có device tree như sau:
```
&soc {
    /* Bộ điều khiển DMA của SoC */
    dma_controller: dma-controller@40000000 {
        compatible = "arm,pl330";
        reg = <0x40000000 0x1000>;
        #dma-cells = <1>;
    };

    /* Node thiết bị UART sử dụng Driver trên */
    my_uart: serial@40001000 {
        compatible = "vendor,my-uart-dma";
        reg = <0x40001000 0x100>;

        /* Ánh xạ tới dma_controller, dùng Request Line 5 cho TX */
        dmas = <&dma_controller 5>;
        dma-names = "tx";
    };
};
```

Ta có driver mẫu virutal serial (UART) slave driver để truyền dữ liệu từ RAM ra ngoài thanh ghi FIFO của ngoại vi như sau:
```c
#include <linux/module.h>
#include <linux/init.h>
#include <linux/kernel.h>
#include <linux/platform_device.h>
#include <linux/dmaengine.h>
#include <linux/dma-mapping.h>
#include <linux/scatterlist.h>
#include <linux/slab.h>

#define DRIVER_NAME "my_uart_dma"
#define DUMMY_FIFO_PHYS_ADDR 0x40001004 /* Địa chỉ giả lập của FIFO Data Register */

/* Cấu trúc dữ liệu quản lý thiết bị */
struct my_uart_device {
    struct device *dev;
    struct dma_chan *tx_chan;
    dma_addr_t fifo_phy_addr;
};

/* Callback được gọi trong Tasklet Context sau khi DMA truyền xong */
static void dma_tx_complete_callback(void *param)
{
    struct my_uart_device *uart = param;
    
    dev_info(uart->dev, "[Tasklet Context] DMA Complete Callback fired!\n");
    dev_info(uart->dev, "Giao dịch truyền dữ liệu ra FIFO đã hoàn thành thành công.\n");

    /* 
     * Lưu ý quan trọng: 
     * Nếu bạn tự alloc/map bộ nhớ động trong luồng truyền, 
     * bạn BẮT BUỘC phải thực hiện dma_unmap_sg() / dma_unmap_single() tại đây.
     */
}

/* Hàm giả lập gửi dữ liệu qua DMA */
static int send_data_dma(struct my_uart_device *uart, void *buf, size_t len)
{
    struct device *dma_dev;
    struct scatterlist sg;
    struct dma_async_tx_descriptor *desc;
    dma_cookie_t cookie;
    int nr_sg;
    int ret = 0;

    dev_info(uart->dev, "--- BẮT ĐẦU QUY TRÌNH TRUYỀN DỮ LIỆU DMA ---");

    /* =========================================================================
     * BƯỚC 2: CẤU HÌNH THAM SỐ SLAVE & CONTROLLER (dmaengine_slave_config)
     * ========================================================================= */
    struct dma_slave_config config = {
        .dst_addr = uart->fifo_phy_addr,          /* Địa chỉ FIFO ngoại vi */
        .dst_addr_width = DMA_SLAVE_BUSWIDTH_1_BYTE, /* Bus rộng 1 byte (UART) */
        .dst_maxburst = 1,                        /* Đẩy 1 byte mỗi lượt request */
    };

    ret = dmaengine_slave_config(uart->tx_chan, &config);
    if (ret) {
        dev_err(uart->dev, "Bước 2 Thất bại: Không thể cấu hình DMA Slave (%d)\n", ret);
        return ret;
    }
    dev_info(uart->dev, "Bước 2 OK: Đã cấu hình FIFO Addr=0x%llx, BusWidth=1Byte\n", 
             (unsigned long long)config.dst_addr);

    /* =========================================================================
     * BƯỚC 3: MAPPING BỘ NHỚ VÀ CHUẨN BỊ DESCRIPTOR (Prep Slave SG)
     * ========================================================================= */
    /* Lấy thiết bị DMA quản lý kênh truyền */
    dma_dev = dmaengine_get_dma_device(uart->tx_chan);

    /* Khởi tạo danh sách Scatterlist với 1 phần tử bộ đệm */
    sg_init_one(&sg, buf, len);

    /* Ánh xạ (Map) địa chỉ Virtual sang Bus DMA Address */
    nr_sg = dma_map_sg(dma_dev, &sg, 1, DMA_TO_DEVICE);
    if (nr_sg == 0) {
        dev_err(uart->dev, "Bước 3 Thất bại: Không thể map DMA scatterlist!\n");
        return -ENOMEM;
    }

    /* Tạo Descriptor giao dịch */
    desc = dmaengine_prep_slave_sg(
        uart->tx_chan,
        &sg,
        nr_sg,
        DMA_MEM_TO_DEV,                     /* RAM -> Device FIFO */
        DMA_PREP_INTERRUPT | DMA_CTRL_ACK   /* Báo ngắt khi xong & Giải phóng desc */
    );

    if (!desc) {
        dev_err(uart->dev, "Bước 3 Thất bại: Không thể tạo Descriptor!\n");
        ret = -EINVAL;
        goto err_unmap;
    }

    /* Đăng ký Callback thông báo hoàn thành */
    desc->callback = dma_tx_complete_callback;
    desc->callback_param = uart;
    dev_info(uart->dev, "Bước 3 OK: Đã map RAM và khởi tạo Descriptor thành công\n");

    /* =========================================================================
     * BƯỚC 4: SUBMIT GIAO DỊCH VÀO HÀNG CHỜ (dmaengine_submit)
     * ========================================================================= */
    cookie = dmaengine_submit(desc);
    if (dma_submit_error(cookie)) {
        dev_err(uart->dev, "Bước 4 Thất bại: Không thể submit Descriptor vào queue!\n");
        ret = -EIO;
        goto err_unmap;
    }
    dev_info(uart->dev, "Bước 4 OK: Đã submit giao dịch (Cookie ID = %d)\n", cookie);

    /* =========================================================================
     * BƯỚC 5: PHÁT LỆNH BẮT ĐẦU TRUYỀN (dma_async_issue_pending)
     * ========================================================================= */
    dma_async_issue_pending(uart->tx_chan);
    dev_info(uart->dev, "Bước 5 OK: Đã kích hoạt DMA (Issue Pending)!\n");

    return 0;

err_unmap:
    dma_unmap_sg(dma_dev, &sg, 1, DMA_TO_DEVICE);
    return ret;
}

/* Hàm Probe của Platform Driver */
static int my_uart_probe(struct platform_device *pdev)
{
    struct my_uart_device *uart;
    char *test_buffer;
    int ret;

    dev_info(&pdev->dev, "Khởi tạo Virtual UART DMA Driver...\n");

    uart = devm_kzalloc(&pdev->dev, sizeof(*uart), GFP_KERNEL);
    if (!uart)
        return -ENOMEM;

    uart->dev = &pdev->dev;
    uart->fifo_phy_addr = DUMMY_FIFO_PHYS_ADDR;

    /* =========================================================================
     * BƯỚC 1: XIN CẤP PHÁT KÊNH DMA SLAVE (dma_request_chan)
     * ========================================================================= */
    /* Tìm kênh "tx" được mô tả trong Device Tree (dma-names = "tx") */
    uart->tx_chan = dma_request_chan(&pdev->dev, "tx");
    if (IS_ERR(uart->tx_chan)) {
        dev_err(&pdev->dev, "Bước 1 Thất bại: Không lấy được kênh DMA 'tx'! Mã lỗi: %ld\n",
                PTR_ERR(uart->tx_chan));
        return PTR_ERR(uart->tx_chan);
    }
    dev_info(&pdev->dev, "Bước 1 OK: Cấp phát thành công kênh DMA '%s'\n",
             dma_chan_name(uart->tx_chan));

    platform_set_drvdata(pdev, uart);

    /* Tạo một chuỗi dữ liệu test trong Kernel RAM */
    test_buffer = kmalloc(64, GFP_KERNEL);
    if (!test_buffer) {
        ret = -ENOMEM;
        goto err_release_chan;
    }
    snprintf(test_buffer, 64, "Hello DMAEngine, this is a test payload!");

    /* Thực thi thử nghiệm luồng truyền DMA từ Bước 2 -> 5 */
    ret = send_data_dma(uart, test_buffer, strlen(test_buffer));
    
    kfree(test_buffer);
    return ret;

err_release_chan:
    dma_release_channel(uart->tx_chan);
    return ret;
}

/* Hàm Remove khi Unload Module */
static int my_uart_remove(struct platform_device *pdev)
{
    struct my_uart_device *uart = platform_get_drvdata(pdev);

    if (uart->tx_chan) {
        /* Dừng các giao dịch đang dở dang và giải phóng kênh DMA */
        dmaengine_terminate_sync(uart->tx_chan);
        dma_release_channel(uart->tx_chan);
        dev_info(&pdev->dev, "Đã giải phóng kênh DMA TX.\n");
    }

    return 0;
}

/* Ánh xạ Device Tree Compatible */
static const struct of_device_id my_uart_of_match[] = {
    { .compatible = "vendor,my-uart-dma", },
    { /* Sentinel */ }
};
MODULE_DEVICE_TABLE(of, my_uart_of_match);

static struct platform_driver my_uart_driver = {
    .probe = my_uart_probe,
    .remove = my_uart_remove,
    .driver = {
        .name = DRIVER_NAME,
        .of_match_table = my_uart_of_match,
    },
};

module_platform_driver(my_uart_driver);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Embedded Linux Developer");
MODULE_DESCRIPTION("Complete 5-step Slave DMAEngine Code Example");
```