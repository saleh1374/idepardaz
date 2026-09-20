using Besaz.Api.Shared;

namespace Besaz.Api.Modules.Orders;

/// <summary>سفارش قطعات — ساخته‌شده از BOM معتبر؛ قیمت‌ها همیشه snapshot هستند.</summary>
public class Order
{
    public long Id { get; set; }
    public long ProjectId { get; set; }
    public string? RecipientName { get; set; }
    public string? ShippingAddress { get; set; }
    public string Status { get; set; } = "Pending";   // Pending / Paid / Shipped / Delivered / Cancelled
    public decimal Total { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

/// <summary>قلم سفارش — کپی snapshot از BOMItem (قانون: قیمت OrderItem همیشه snapshot).</summary>
public class OrderItem
{
    public long Id { get; set; }
    public long OrderId { get; set; }
    public string LogicalPartId { get; set; } = "";
    public string LogicalPartName { get; set; } = "";
    public string? Sku { get; set; }
    public string? SupplierName { get; set; }
    public string? Url { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }

    public Order? Order { get; set; }
}

/// <summary>پرداخت — پشت IPaymentGateway (ZarinPal/IDPay — Integration Pending).</summary>
public class Payment
{
    public long Id { get; set; }
    public long OrderId { get; set; }
    public string Gateway { get; set; } = "Stub";
    public string Status { get; set; } = "Pending";  // Pending / Success / Failed
    public decimal Amount { get; set; }
    public string? ReferenceId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}