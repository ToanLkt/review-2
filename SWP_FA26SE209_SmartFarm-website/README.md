# SWP_FA26SE209 Smart Farm

## Quy ước Git

### 1. Cấu trúc nhánh

```text
main                         Bản phát hành ổn định nhất
└── dev                      Tích hợp code ổn định từ dev-fe và dev-be
    ├── dev-fe               Tích hợp chung cho Frontend
    │   ├── website          Tích hợp các chức năng Web
    │   │   └── feature/<role>_<ten-chuc-nang>
    │   └── mobile           Tích hợp các chức năng Mobile
    │       └── feature/<role>_<ten-chuc-nang>
    └── dev-be               Tích hợp các chức năng Backend
        └── feature/<role>_<ten-chuc-nang>
```

| Nhánh | Mục đích | Nhận merge từ | Merge vào |
| --- | --- | --- | --- |
| `main` | Chứa phiên bản đã kiểm thử và ổn định nhất để phát hành | `dev` | Không merge trực tiếp sang nhánh khác |
| `dev` | Tích hợp toàn bộ hệ thống | `dev-fe`, `dev-be` | `main` |
| `dev-fe` | Tích hợp Frontend đã ổn định | `website`, `mobile` | `dev` |
| `website` | Tích hợp chức năng cho Web | Các nhánh feature Web | `dev-fe` |
| `mobile` | Tích hợp chức năng cho Mobile | Các nhánh feature Mobile | `dev-fe` |
| `dev-be` | Tích hợp chức năng Backend | Các nhánh feature Backend | `dev` |

Không commit trực tiếp lên `main`, `dev`, `dev-fe`, `dev-be`, `website` hoặc `mobile`. Mọi thay đổi phải được thực hiện trên nhánh riêng và đưa vào nhánh đích bằng Pull Request (PR).

### 2. Quy tắc đặt tên nhánh chức năng

```text
feature/<role>_<ten-chuc-nang>
```

Quy tắc:

- `role`: vai trò sử dụng chức năng, ví dụ `admin`, `farmer`, `expert`, `guest` hoặc `system`.
- `ten-chuc-nang`: mô tả ngắn gọn chức năng bằng tiếng Việt không dấu hoặc tiếng Anh.
- Chỉ dùng chữ thường; dùng dấu gạch ngang `-` để ngăn cách các từ trong tên chức năng.
- Không dùng khoảng trắng, ký tự có dấu hoặc ký tự đặc biệt.

Ví dụ:

```text
/feature/admin_quan-ly-nguoi-dung
feature/farmer_xem-do-am-dat
feature/expert_tu-van-cay-trong
feature/system_gui-canh-bao
```

Tạo nhánh feature từ đúng nhánh tích hợp của phần đang phát triển:

```bash
# Website
git switch 
git pull origin website
git switch -c feature/admin_quan-ly-nguoi-dung

# Mobile
git switch mobile
git pull origin mobile
git switch -c feature/farmer_xem-do-am-dat

# Backend
git switch dev-be
git pull origin dev-be
git switch -c feature/system_gui-canh-bao
```

### 3. Quy tắc commit theo type

Mỗi commit tuân theo định dạng Conventional Commits:

```text
<type>(<scope>): <mo-ta-ngan-gon>
```

Trong đó:

- `type`: loại thay đổi, bắt buộc.
- `scope`: phạm vi thay đổi, khuyến khích sử dụng; ví dụ `web`, `mobile`, `api`, `auth`, `sensor`, `database` hoặc `docs`.
- `mo-ta-ngan-gon`: viết ở thể mệnh lệnh, không viết hoa chữ đầu và không đặt dấu chấm ở cuối.

| Type | Khi sử dụng | Ví dụ |
| --- | --- | --- |
| `feat` | Thêm chức năng mới | `feat(web): them man hinh quan ly nguoi dung` |
| `fix` | Sửa lỗi | `fix(api): sua loi xac thuc token` |
| `docs` | Thay đổi tài liệu | `docs(readme): bo sung quy uoc git` |
| `style` | Chỉnh định dạng, không đổi logic | `style(mobile): dinh dang lai man hinh dang nhap` |
| `refactor` | Cải thiện cấu trúc code, không thêm chức năng hoặc sửa lỗi | `refactor(api): tach service xu ly cam bien` |
| `test` | Thêm hoặc sửa kiểm thử | `test(auth): them test dang nhap that bai` |
| `chore` | Công việc bảo trì, cấu hình hoặc dependency | `chore(web): cap nhat dependencies` |
| `perf` | Cải thiện hiệu năng | `perf(api): toi uu truy van du lieu cam bien` |
| `build` | Thay đổi hệ thống build hoặc dependency build | `build(mobile): cau hinh android release` |
| `ci` | Thay đổi pipeline CI/CD | `ci(github): them workflow kiem tra pull request` |
| `revert` | Hoàn tác một commit trước đó | `revert: hoan tac thay doi xac thuc` |

Quy tắc bổ sung:

- Một commit chỉ nên giải quyết một thay đổi logic.
- Không dùng nội dung chung chung như `update`, `fix bug`, `change code`.
- Không commit secret, file `.env`, khóa API, mật khẩu hoặc dữ liệu nhạy cảm.
- Nếu có breaking change, thêm `!` sau type/scope và mô tả chi tiết trong phần thân commit, ví dụ `feat(api)!: thay doi cau truc response`.

### 4. Luồng làm việc và Pull Request

1. Cập nhật nhánh gốc phù hợp (`website`, `mobile` hoặc `dev-be`).
2. Tạo nhánh `feature/<role>_<ten-chuc-nang>`.
3. Commit theo đúng type và đẩy nhánh lên remote.
4. Tạo PR về chính nhánh đã dùng làm nhánh gốc.
5. Chỉ merge khi code đã được review và các kiểm thử đều thành công.
6. Sau khi ổn định, merge theo luồng:

```text
Web feature     -> website --\
                              -> dev-fe --\
Mobile feature  -> mobile  --/             \
                                             -> dev -> main
Backend feature -> dev-be ------------------/
```

### 5. Quy tắc merge

- Feature PR ưu tiên **Squash and merge** để lịch sử gọn và commit sau khi squash vẫn đúng định dạng ở mục 3.
- PR tích hợp giữa `website`/`mobile` và `dev-fe`, giữa `dev-fe`/`dev-be` và `dev` nên dùng merge commit để giữ lịch sử tích hợp.
- Chỉ tạo PR từ `dev` sang `main` khi phiên bản đã qua kiểm thử tích hợp và sẵn sàng phát hành.
- Xử lý conflict tại nhánh nguồn của PR, sau đó kiểm thử lại trước khi merge.
- PR phải có tiêu đề rõ ràng, mô tả thay đổi, cách kiểm thử và ảnh/video minh họa nếu có thay đổi giao diện.
