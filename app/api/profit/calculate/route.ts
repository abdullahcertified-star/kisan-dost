import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const crop = body.crop || 'Wheat';
    const acres = Number(body.acres || 5);

    // Yield defaults per acre (maunds)
    let yieldPerAcre = Number(body.target_yield || (crop.toLowerCase().includes('cotton') ? 30 : crop.toLowerCase().includes('canola') ? 24 : 40));
    let pricePerMaund = Number(body.market_price || (crop.toLowerCase().includes('cotton') ? 8400 : crop.toLowerCase().includes('canola') ? 8200 : 3900));

    const grossRevenuePerAcre = yieldPerAcre * pricePerMaund;
    const totalGrossRevenue = grossRevenuePerAcre * acres;

    // Costs
    const landPrep = 12000 * acres;
    const seedCost = 8000 * acres;
    const fertCost = 21000 * acres;
    const irrigationCost = 15000 * acres;
    const pestCost = 8000 * acres;
    const harvestCost = 14000 * acres;

    const totalCost = landPrep + seedCost + fertCost + irrigationCost + pestCost + harvestCost;
    const netProfit = totalGrossRevenue - totalCost;
    const profitPerAcre = Math.round(netProfit / acres);
    const roi = Math.round((netProfit / totalCost) * 100);

    return NextResponse.json({
      crop,
      acres,
      expected_yield_total_maunds: yieldPerAcre * acres,
      gross_revenue: totalGrossRevenue,
      total_cost: totalCost,
      net_profit: netProfit,
      profit_per_acre: profitPerAcre,
      roi_percentage: roi,
      cost_breakdown: {
        land_preparation: landPrep,
        seeds: seedCost,
        fertilizer: fertCost,
        irrigation: irrigationCost,
        pest_control: pestCost,
        harvesting: harvestCost,
      },
      disclaimer: 'Calculated using Punjab Agricultural Economics benchmarks and AMIS market wholesale prices.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to calculate profit', details: err.message }, { status: 500 });
  }
}
