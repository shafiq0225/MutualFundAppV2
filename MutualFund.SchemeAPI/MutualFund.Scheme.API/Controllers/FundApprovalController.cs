using Microsoft.AspNetCore.Mvc;
using MutualFund.Scheme.Application.UseCases.Commands;
using MutualFund.Scheme.Domain.Exceptions;

namespace MutualFund.Scheme.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FundApprovalController : ControllerBase
    {
        private readonly UpdateFundApprovalCommand _command;

        public FundApprovalController(UpdateFundApprovalCommand command)
        {
            _command = command;
        }

        [HttpPut("{fundCode}")]
        public async Task<IActionResult> UpdateFundApproval(
            string fundCode, [FromQuery] bool isApproved)
        {
            if (string.IsNullOrWhiteSpace(fundCode))
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { "fundCode", new[] { "FundCode is required." } }
                });

            var count = await _command.ExecuteAsync(fundCode, isApproved);

            return Ok(new
            {
                FundCode = fundCode,
                IsApproved = isApproved,
                SchemesAffected = count,
                Message = $"Successfully updated {count} scheme(s)"
            });
        }
    }
}