using Besaz.Api.Modules.Users;
using Besaz.Api.Shared;

namespace Besaz.Api.Http;

/// <summary>بافت کاربر در حالت MVP — هدر اختیاری X-User-Id/X-User-Name؛ پیش‌فرض میهمان.</summary>
public static class UserContext
{
    public static (Guid Id, string Name) Resolve(HttpRequest req)
    {
        var ok = Guid.TryParse(req.Headers["X-User-Id"].ToString(), out var id);
        var name = req.Headers["X-User-Name"].ToString();
        if (!ok)
        {
            id = WellKnownUsers.Guest;
            name = string.IsNullOrWhiteSpace(name) ? "میهمان" : name;
        }
        else if (string.IsNullOrWhiteSpace(name))
        {
            name = "کاربر";
        }
        return (id, name);
    }
}