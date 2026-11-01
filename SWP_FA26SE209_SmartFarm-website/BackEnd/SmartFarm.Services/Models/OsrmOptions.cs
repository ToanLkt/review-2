namespace SmartFarm.Services.Models;

// Cấu hình kết nối tới OSRM (Project-OSRM/osrm-backend) - dịch vụ định tuyến để tính khoảng cách giao hàng.
// BaseUrl: địa chỉ gốc của OSRM HTTP server (vd self-host "http://localhost:5000" hoặc demo "https://router.project-osrm.org").
// Profile: hồ sơ di chuyển dùng trong route service (driving/cycling/walking) - tuỳ dataset OSRM đã build.
// TimeoutSeconds: thời gian chờ tối đa mỗi lần gọi OSRM.
// Enabled: bật/tắt việc gọi OSRM. Khi tắt (hoặc thiếu BaseUrl) hệ thống bỏ qua bước tính khoảng cách thay vì làm hỏng luồng tạo đơn.
public sealed class OsrmOptions
{
    public bool Enabled { get; set; } = false;
    public string BaseUrl { get; set; } = "";
    public string Profile { get; set; } = "driving";
    public int TimeoutSeconds { get; set; } = 10;
}
