using SmartFarm.Services.Models;

namespace SmartFarm.Services.Services;

internal static class QueryHelper
{
    public static (int Page, int Size) Paging(QueryRequest request) =>
        (Math.Max(request.Page, 1), Math.Clamp(request.PageSize, 1, 100));

    public static object SelectFields(object value, string? fields)
    {
        if (string.IsNullOrWhiteSpace(fields)) return value;
        var requested = fields.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        return value.GetType().GetProperties()
            .Where(p => requested.Contains(p.Name))
            .ToDictionary(p => char.ToLowerInvariant(p.Name[0]) + p.Name[1..], p => p.GetValue(value));
    }
}
