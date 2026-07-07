using MutualFund.Investment.Application.Orders.Dtos;
using MutualFund.Investment.Domain.Common;
using MutualFund.Investment.Domain.Entities;
using MutualFund.Investment.Domain.Enums;
using MutualFund.Investment.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace MutualFund.Investment.Application.Orders.Commands
{
    public class UpdateOrderStatusCommand
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<UpdateOrderStatusCommand> _logger;

        public UpdateOrderStatusCommand(
            IUnitOfWork unitOfWork,
            ILogger<UpdateOrderStatusCommand> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Result<InvestmentOrderDto>> ExecuteAsync(
            int orderId,
            UpdateOrderStatusDto dto,
            string updatedByUserId)
        {
            try
            {
                // ── Find order ─────────────────────────────────────
                var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
                if (order == null)
                    return Result<InvestmentOrderDto>
                        .Failure($"Order with Id {orderId} not found.");

                // ── Parse new status ───────────────────────────────
                if (!Enum.TryParse<OrderStatus>(
                        dto.NewStatus, true, out var newStatus))
                    return Result<InvestmentOrderDto>
                        .Failure($"Invalid status: {dto.NewStatus}. " +
                                 "Valid: Submitted, Confirmed, Active, Cancelled");

                // ── Validate transition ────────────────────────────
                var transitionResult = ValidateTransition(
                    order.Status, newStatus);

                if (!transitionResult.IsSuccess)
                    return Result<InvestmentOrderDto>
                        .Failure(transitionResult.ErrorMessage!);

                _logger.LogInformation(
                    "Order {OrderNumber}: {From} → {To}",
                    order.OrderNumber, order.Status, newStatus);

                // ── Apply status-specific changes ──────────────────
                switch (newStatus)
                {
                    case OrderStatus.Submitted:
                        await ApplySubmitted(order, dto, updatedByUserId);
                        break;

                    case OrderStatus.Confirmed:
                        var confirmResult = await ApplyConfirmed(
                            order, dto, updatedByUserId);
                        if (!confirmResult.IsSuccess)
                            return Result<InvestmentOrderDto>
                                .Failure(confirmResult.ErrorMessage!);
                        break;

                    case OrderStatus.Active:
                        await ApplyActive(order, dto);
                        break;

                    case OrderStatus.Cancelled:
                        await ApplyCancelled(order, dto);
                        break;
                }

                // ── Update status ──────────────────────────────────
                order.Status = newStatus;
                order.UpdatedAt = DateTime.UtcNow;

                if (!string.IsNullOrWhiteSpace(dto.Notes))
                    order.Notes = dto.Notes;

                await _unitOfWork.Orders.UpdateAsync(order);
                await _unitOfWork.CompleteAsync();

                _logger.LogInformation(
                    "✅ Order {OrderNumber} updated to {Status}",
                    order.OrderNumber, newStatus);

                return Result<InvestmentOrderDto>
                    .Success(OrderMapper.ToDto(order));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error updating order {OrderId} status", orderId);
                return Result<InvestmentOrderDto>
                    .Failure($"Failed to update order: {ex.Message}");
            }
        }

        // ── Status Transition Validation ───────────────────────────
        private static Domain.Common.Result ValidateTransition(
            OrderStatus current, OrderStatus next)
        {
            var allowed = new Dictionary<OrderStatus, OrderStatus[]>
            {
                { OrderStatus.Pending,   new[] { OrderStatus.Submitted,
                                                 OrderStatus.Cancelled } },
                { OrderStatus.Submitted, new[] { OrderStatus.Confirmed,
                                                 OrderStatus.Cancelled } },
                { OrderStatus.Confirmed, new[] { OrderStatus.Active } },
                { OrderStatus.Active,    Array.Empty<OrderStatus>() },
                { OrderStatus.Cancelled, Array.Empty<OrderStatus>() }
            };

            if (!allowed[current].Contains(next))
                return Domain.Common.Result.Failure(
                    $"Cannot move order from '{current}' to '{next}'. " +
                    $"Allowed transitions from '{current}': " +
                    $"{string.Join(", ", allowed[current])}");

            return Domain.Common.Result.Success();
        }

        // ── Submitted ──────────────────────────────────────────────
        private Task ApplySubmitted(
            InvestmentOrder order,
            UpdateOrderStatusDto dto,
            string userId)
        {
            order.SubmittedDate = dto.SubmittedDate ?? DateTime.Today;
            order.SubmittedByUserId = dto.SubmittedByUserId ?? userId;
            return Task.CompletedTask;
        }

        // ── Confirmed ──────────────────────────────────────────────
        private async Task<Domain.Common.Result> ApplyConfirmed(
            InvestmentOrder order,
            UpdateOrderStatusDto dto,
            string userId)
        {
            // Validate confirmation details
            if (dto.PurchaseNAV == null || dto.PurchaseNAV <= 0)
                return Domain.Common.Result.Failure(
                    "Purchase NAV is required when confirming an order.");

            if (string.IsNullOrWhiteSpace(dto.FolioNumber))
                return Domain.Common.Result.Failure(
                    "Folio number is required when confirming an order.");

            // Calculate units
            var units = order.InvestedAmount / dto.PurchaseNAV.Value;

            order.ConfirmedDate = dto.ConfirmedDate ?? DateTime.Today;
            order.PurchaseNAV = dto.PurchaseNAV;
            order.FolioNumber = dto.FolioNumber;
            order.UnitsAllotted = dto.UnitsAllotted ?? Math.Round(units, 6);

            _logger.LogInformation(
                "Order {OrderNumber} confirmed: NAV={NAV} Units={Units} " +
                "Folio={Folio}",
                order.OrderNumber,
                order.PurchaseNAV,
                order.UnitsAllotted,
                order.FolioNumber);

            return Domain.Common.Result.Success();
        }

        // ── Active — create Holding ────────────────────────────────
        private async Task ApplyActive(
            InvestmentOrder order,
            UpdateOrderStatusDto dto)
        {
            // Check if holding already created
            var holdingExists = await _unitOfWork.Holdings
                .ExistsForOrderAsync(order.Id);

            if (!holdingExists)
            {
                // Create the Holding record
                var holding = new Holding
                {
                    OrderId = order.Id,
                    InvestorUserId = order.InvestorUserId,
                    InvestorName = order.InvestorName,
                    SchemeCode = order.SchemeCode,
                    SchemeName = order.SchemeName,
                    FundName = order.FundName,
                    FolioNumber = order.FolioNumber!,
                    PurchaseDate = order.ConfirmedDate ?? DateTime.Today,
                    PurchaseNAV = order.PurchaseNAV!.Value,
                    InvestedAmount = order.InvestedAmount,
                    Units = order.UnitsAllotted!.Value,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Holdings.AddAsync(holding);

                _logger.LogInformation(
                    "✅ Holding created for order {OrderNumber}: " +
                    "{Units} units of {Scheme}",
                    order.OrderNumber,
                    holding.Units,
                    holding.SchemeName);
            }
        }

        // ── Cancelled ──────────────────────────────────────────────
        private Task ApplyCancelled(
            InvestmentOrder order,
            UpdateOrderStatusDto dto)
        {
            _logger.LogWarning(
                "Order {OrderNumber} cancelled. Reason: {Notes}",
                order.OrderNumber, dto.Notes);
            return Task.CompletedTask;
        }
    }
}