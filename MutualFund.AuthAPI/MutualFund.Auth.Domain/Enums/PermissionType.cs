namespace MutualFund.Auth.Domain.Enums
{
    /// <summary>
    /// Master list of all permission codes in the system.
    /// Add new permission codes here as new features are added.
    /// </summary>
    public static class PermissionType
    {
        // SchemeEnrollment permissions
        public const string SchemeRead = "scheme.read";
        public const string SchemeCreate = "scheme.create";
        public const string SchemeUpdate = "scheme.update";

        // Fund Approval permissions
        public const string FundApproval = "fund.approval";

        // NAV Comparison permissions
        public const string NavRead = "nav.read";

        // User Management — Admin only
        public const string UserManage = "user.manage";

        // Family Group Management
        public const string FamilyManage = "family.manage";

        public static IEnumerable<string> GetAll() =>
        [
            SchemeRead,
            SchemeCreate,
            SchemeUpdate,
            FundApproval,
            NavRead,
            UserManage,
            FamilyManage
        ];
    }
}