using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

// Dịch vụ tính khoảng cách đường đi giữa hai toạ độ, dùng OSRM (Project-OSRM/osrm-backend).
public interface IRoutingService
{
    // Trả về khoảng cách đường đi (km) từ điểm xuất phát (farm) tới điểm đến (khách),
    // hoặc null nếu OSRM bị tắt / không cấu hình / không tìm được tuyến / gọi lỗi.
    Task<double?> GetDistanceKmAsync(double fromLat, double fromLng, double toLat, double toLng,
        CancellationToken cancellationToken = default);
}

public sealed class OsrmRoutingService(HttpClient httpClient, OsrmOptions options) : IRoutingService
{
    public async Task<double?> GetDistanceKmAsync(double fromLat, double fromLng, double toLat, double toLng,
        CancellationToken cancellationToken = default)
    {
        if (!options.Enabled || string.IsNullOrWhiteSpace(options.BaseUrl)) return null;

        var profile = string.IsNullOrWhiteSpace(options.Profile) ? "driving" : options.Profile.Trim();
        var baseUrl = options.BaseUrl.TrimEnd('/');
        // OSRM route service: /route/v1/{profile}/{lon,lat;lon,lat}. Toạ độ theo thứ tự KINH ĐỘ,VĨ ĐỘ.
        // overview=false & alternatives=false để phản hồi gọn, chỉ cần distance.
        var coordinates = string.Format(CultureInfo.InvariantCulture,
            "{0},{1};{2},{3}", fromLng, fromLat, toLng, toLat);
        var requestUri = $"{baseUrl}/route/v1/{profile}/{coordinates}?overview=false&alternatives=false&steps=false";

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
            if (!request.Headers.UserAgent.Any())
                request.Headers.UserAgent.ParseAdd("SmartFarm-Backend/1.0");

            using var httpResponse = await httpClient.SendAsync(request, cancellationToken);
            if (!httpResponse.IsSuccessStatusCode) return null;

            var response = await httpResponse.Content.ReadFromJsonAsync<OsrmRouteResponse>(cancellationToken: cancellationToken);
            if (response is null || !string.Equals(response.Code, "Ok", StringComparison.OrdinalIgnoreCase)) return null;
            var meters = response.Routes?.FirstOrDefault()?.Distance;
            if (meters is null || double.IsNaN(meters.Value) || meters.Value < 0) return null;
            // OSRM trả mét -> quy đổi km, làm tròn 3 chữ số.
            return Math.Round(meters.Value / 1000d, 3);
        }
        catch (HttpRequestException) { return null; }
        catch (TaskCanceledException) { return null; } // timeout
        catch (NotSupportedException) { return null; }  // content-type không hợp lệ
        catch (System.Text.Json.JsonException) { return null; }
    }

    private sealed class OsrmRouteResponse
    {
        [JsonPropertyName("code")] public string? Code { get; set; }
        [JsonPropertyName("routes")] public List<OsrmRoute>? Routes { get; set; }
    }

    private sealed class OsrmRoute
    {
        [JsonPropertyName("distance")] public double? Distance { get; set; }
        [JsonPropertyName("duration")] public double? Duration { get; set; }
    }
}
