# Đóng gói Ứng dụng Tàn Thành: Vạn Giới

Hướng dẫn chạy và đóng gói ứng dụng cho Windows PC (Electron) và Android (Capacitor).

## 1. Chạy ứng dụng PC cục bộ
```bash
cd app/desktop
npm install
npm start
```
Lệnh `npm start` sẽ tự động chạy script `sync` để sao chép tài nguyên web mới nhất vào `app/www/` trước khi mở game.

## 2. Đóng gói bản cài đặt Windows (.exe)
```bash
cd app/desktop
npm run dist
```
File cài đặt `.exe` (NSIS và Portable) sẽ được xuất ra tại thư mục `app/desktop/dist/`.

## 3. Lấy file APK từ GitHub Actions
1. Vào tab **Actions** trên GitHub repository.
2. Chọn workflow **Build Android APK**.
3. Bấm nút **Run workflow** để kích hoạt tiến trình build.
4. Sau khi workflow hoàn thành, tải artifact có tên **tan-thanh-apk** (chứa file `app-debug.apk`).
5. Cài đặt file APK lên thiết bị Android bằng cách cho phép cài đặt từ nguồn không xác định (*allow unknown sources*).
