namespace MutualFund.Investment.Domain.Enums
{
    public enum OrderStatus
    {
        Pending = 1,   // Admin created — waiting for submission
        Submitted = 2,   // Employee visited MF office
        Confirmed = 3,   // MF company confirmed — NAV + Units known
        Active = 4,   // Investment live — daily P&L tracked
        Cancelled = 5    // Cancelled before submission
    }
}