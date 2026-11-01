using System.Security.Claims;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFarm.Repositories.Entities;
using SmartFarm.Services.Models;
using SmartFarm.Services.Services;

namespace SmartFarm.Api.Controllers;

/// <summary>
/// Giỏ hàng thuê khay của Customer. Mỗi item = 1 khay + 1 loại hạt. Giỏ tách riêng khỏi luồng
/// mua hạt (SEED_PACKET). Khay chỉ bị giữ khi checkout.
/// </summary>
[ApiController, ApiVersion(1.0)]
[Route("api/v{version:apiVersion}/cart")]
[Authorize(Roles = RoleNames.Customer)]
[Produces("application/json", "application/xml")]
public class CartController(ICartService service) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>Xem giỏ hàng hiện tại kèm tổng tạm tính (subtotal + phí chăm sóc + phí giao).</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<CartResponse>>> Get()
        => Ok(ApiResponse<CartResponse>.Ok(await service.GetAsync(UserId)));

    /// <summary>Thêm 1 khay + 1 loại hạt vào giỏ.</summary>
    [HttpPost("items")]
    public async Task<ActionResult<ApiResponse<CartResponse>>> AddItem([FromBody] AddCartItemRequest request)
        => Ok(ApiResponse<CartResponse>.Ok(await service.AddItemAsync(UserId, request), "Item added to cart"));

    /// <summary>Cập nhật số chu kỳ hoặc ngày gieo dự kiến cho 1 dòng trong giỏ trước khi checkout.</summary>
    [HttpPut("items/{cartItemId:int}")]
    public async Task<ActionResult<ApiResponse<CartResponse>>> UpdateItem(int cartItemId, [FromBody] UpdateCartItemRequest request)
        => Ok(ApiResponse<CartResponse>.Ok(await service.UpdateItemAsync(UserId, cartItemId, request), "Cart item updated"));

    /// <summary>Bỏ 1 dòng khỏi giỏ.</summary>
    [HttpDelete("items/{cartItemId:int}")]
    public async Task<ActionResult<ApiResponse<CartResponse>>> RemoveItem(int cartItemId)
        => Ok(ApiResponse<CartResponse>.Ok(await service.RemoveItemAsync(UserId, cartItemId), "Item removed"));

    /// <summary>Xóa toàn bộ giỏ.</summary>
    [HttpDelete]
    public async Task<ActionResult<ApiResponse<CartResponse>>> Clear()
        => Ok(ApiResponse<CartResponse>.Ok(await service.ClearAsync(UserId), "Cart cleared"));

    /// <summary>Checkout: khóa đủ khay, tạo 1 đơn thuê (AWAITING_PAYMENT), tính tổng tiền.</summary>
    [HttpPost("checkout")]
    public async Task<ActionResult<ApiResponse<OrderResponse>>> Checkout([FromBody] CheckoutCartRequest? request = null)
    {
        var order = await service.CheckoutAsync(UserId, request ?? new CheckoutCartRequest());
        return StatusCode(201, ApiResponse<OrderResponse>.Ok(order, "Rental order created from cart"));
    }
}
