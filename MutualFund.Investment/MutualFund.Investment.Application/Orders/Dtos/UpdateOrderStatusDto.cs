namespace MutualFund.Investment.Application.Orders.Dtos
{
    /// <summary>
    /// Used to move order through status workflow:
    ///   Pending → Submitted → Confirmed → Active
    /// Each status change captures different data.
    /// </summary>
    public class UpdateOrderStatusDto
    {
        public string NewStatus { get; set; } = string.Empty;
        // "Submitted" | "Confirmed" | "Active" | "Cancelled"

        // ── Required when NewStatus = "Submitted" ──────────────────
        public DateTime? SubmittedDate { get; set; }
        public string? SubmittedByUserId { get; set; }

        // ── Required when NewStatus = "Confirmed" ──────────────────
        // Admin enters these from the MF company confirmation
        public DateTime? ConfirmedDate { get; set; }
        public decimal? PurchaseNAV { get; set; }
        public decimal? UnitsAllotted { get; set; }
        public string? FolioNumber { get; set; }

        // ── Optional ───────────────────────────────────────────────
        public string? Notes { get; set; }
    }
}