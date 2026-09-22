---
layout: post
title: how to use git to manage a project
date: 2026-09-21 15:09:00
description: 
tags: git
categories: 
featured: false
---

Blog này bàn luận về git, cách dùng git cho việc quản lý 1 dự án.

### 1. Cách thêm SSH key cho tài khoản git
:question: SSH key là gì, tại sao cần có SSH key?  
Hình dung đơn giản, khi ta thao tác git push, git pull, máy chủ git sẽ dùng public key để mã hóa một thông điệp thử thách. Chỉ có private key tương ứng trên máy tính của ta mới giải mã được thông điệp đó, giúp máy chủ xác nhận chính ta là người sở hữu mà không cần truyền mật khẩu qua mạng.

:question: Cơ chế cặp khóa?  
- private key: Lưu trữ cẩn thận trên máy tính cá nhân.
- public key: Được tải và lưu trên máy chủ Git (GitHub, GitLab, Bitbucket...).

---
**Cách tạo SSH key trên Linux và thêm vào github, gitlab, bitbucket...**

:exclamation: Cách kiểm tra SSH key đã có trên máy chưa?
```git
ls -al ~/.ssh
```

Nếu đã thấy xuất hiện các file như id_ed25519.pub hoặc id_rsa.pub, nghĩa là ta đã có SSH key. Nếu chưa có, ta sẽ tạo key.

:exclamation: Các tạo key SSH mới   
Ta sẽ chạy lệnh tạo key với thuật toán ED25519
```git
ssh-keygen -t ed26619 -C "youremail"
```
Khi hệ thống hỏi thì chỉ cần Enter để by pass hết là được. Mặc định public key sẽ được lưu tại `~/.ssh/id_ed25519`. 

:exclamation: Copy nội dung SSH key thêm vòa Github/Gitlab
```git
cat ~/.ssh/id_ed25518.pub
```
Sau khi copy thì chỉ cần tạo mới ssh key trên setting của tài khoản trên Github/Gitlab là được.

:exlamation: Kiểm tra kết nối
```git
ssh -T git@github.com
```

Nếu thành công màn hình sẽ hiển thị thông báo dạng:
```
Hi ! You've successfully authenticated, but GitHub does not provide shell access.
```
Sau khi đã tạo SSH key thì ta sẽ clone repo bằng SSH link là sẽ mặc định được push pull thoải mái mà không cần nhập mật khẩu mỗi lần push pull.

### 2. Câu lệnh khởi tạo và cấu hình git
Các câu lệnh này thường được dùng khi ta clone repo mới, hay setup git trên 1 máy mới.  
:exclamation: Các câu lệnh dùng để thiết lập thông tin cá nhân hoặc khởi tạo kho lưu trữ:

```git
# Sao chép (clone) một dự án từ Remote (GitHub/GitLab) về máy
git clone <URL_du_an>

# Cấu hình tên và email (Bắt buộc khi mới cài Git)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Câu lệnh quản lý trạng thái và thay đổi
Các câu lệnh push pull sử dụng hàng ngày:
```
# Kiểm tra trạng thái các file (file nào mới, file nào bị sửa, file đã stage)
git status

# Đưa file vào khu vực chuẩn bị commit (Staging Area)
git add <ten_file>       # Đưa 1 file cụ thể
git add .                # Đưa toàn bộ các file thay đổi vào Stage

# Lưu lại các thay đổi đã stage vào lịch sử Git
git commit -m "Nội dung mô tả thay đổi"

# Xem lịch sử các commit đã tạo
git log --oneline        # Xem dạng rút gọn 1 dòng/commit
git log --graph          # Xem dạng sơ đồ cây trực quan

# Kiểm tra các Remote URL đang kết nối
git remote -v

# Thêm một Remote mới
git remote add origin <URL_du_an>

# Sau khi đã thiết lập origin cho url, set upstream cho branch thì khi ta muốn push, pull chỉ cần gọi đơn giản
git push
git pull

# Pull dữ liệu xuống và gộp vào nhánh hiện tại
git pull origin <ten_nhanh>

# Push các commit từ local lên nhánh remote cụ thể
git push origin <ten_nhanh>
git push -u origin <ten_nhanh>   # Lưu mặc định origin/nhanh cho các lần push sau chỉ cần gõ 'git push
```

### 4. Quản lý nhánh
Việc quản lý nhánh là cực kỳ quan trọng, bởi ta cần làm việc trên nhánh riêng khi phát triển tính năng mới nhằm không làm hỏng code chạy ổn định ở (main/master/develop).
```
# Liệt kê danh sách các nhánh
git branch               # Nhánh ở local
git branch -a            # Tất cả nhánh (bao gồm cả remote)

# Tạo nhánh mới
git branch <ten_nhanh>

# Chuyển sang nhánh khác
git checkout <ten_nhanh>
git switch <ten_nhanh>   # Lệnh mới, dễ nhớ hơn checkout

# Tạo nhánh mới và chuyển sang nhánh đó ngay lập tức
git checkout -b <ten_nhanh_moi>
git switch -c <ten_nhanh_moi>

# Gộp (Merge) code từ nhánh khác vào nhánh hiện tại
git merge <ten_nhanh_can_gop>

# Xóa nhánh
git branch -d <ten_nhanh>        # Xóa an toàn (đã merge)
git branch -D <ten_nhanh>        # Xóa ép buộc (chưa merge)
```

### 5. Hủy bỏ, khôi phục thay đổi
```Git
# Bỏ các thay đổi chưa commit của một file (khôi phục về trạng thái commit gần nhất)
git checkout -- <ten_file>
git restore <ten_file>

# Đưa file ra khỏi Staging Area (bỏ 'git add')
git restore --staged <ten_file>

# Sửa lại message của commit gần nhất (hoặc thêm file quên commit)
git commit --amend -m "Message moi"

# Huỷ bỏ commit nhưng GIỮ LẠI code thay đổi ở file
git reset HEAD~1

# Huỷ bỏ commit và XÓA SẠCH mọi thay đổi (Cẩn thận khi dùng!)
git reset --hard HEAD~1

# Tạo một commit mới đảo ngược lại toàn bộ thay đổi của một commit cũ
git revert <commit_hash>
```

### 6. Các thao tác để lưu lại phiên làm việc hiện tại, quay lại 1 thời điểm trong quá khứ và trở về hiện tại 1 cách an toàn
```
# Cất tạm thời các thay đổi dở dang để chuyển nhánh gấp
git stash                # Lưu các thay đổi hiện tại vào bộ nhớ tạm
git stash pop            # Lấy lại thay đổi gần nhất và xóa khỏi stash
git stash list           # Xem danh sách các lần stash

# Tái cấu trúc lịch sử commit (Giúp cây commit thẳng và sạch đẹp)
git rebase <ten_nhanh_goc>

# Lấy 1 commit cụ thể từ nhánh khác đắp vào nhánh hiện tại
git cherry-pick <commit_hash>

# Xem nhật ký mọi thao tác đối với HEAD (Dùng để cứu code khi lỡ xóa nhầm/reset hard)
git reflog
```
