namespace MutualFund.Auth.Domain.Enums
{
    /// <summary>
    /// Master list of all permission codes in the system.
    /// Add new permission codes here as new features are added.
    /// </summary>
    public static class PermissionType
    {
        // SchemeEnrollment feature (includes fund approval) — single
        // blanket permission by design: an Employee either has access to
        // manage scheme enrollment or doesn't, no separate read/write tiers.
        public const string SchemeManage = "scheme.manage";

        // User Management — Admin only
        public const string UserManage = "user.manage";

        // Family Group Management
        public const string FamilyManage = "family.manage";

        public static IEnumerable<string> GetAll() =>
        [
            SchemeManage,
            UserManage,
            FamilyManage
        ];
    }
}