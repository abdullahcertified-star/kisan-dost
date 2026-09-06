import { NextRequest, NextResponse } from 'next/server';

const CROP_URDU: Record<string, string> = {
  wheat: 'گندم',
  cotton: 'کپاس',
  rice: 'دھان / چاول',
  maize: 'مکئی',
  potato: 'آلو',
  mustard: 'سرسوں / رایا',
  canola: 'کینولا',
  chickpea: 'چنا',
  sugarcane: 'کماد',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const crop = body.crop || 'Wheat';
    const cleanCrop = crop.toLowerCase().trim();
    const acres = Number(body.acres || 5);

    // Urdu crop name
    let crop_ur = 'زرعی فصل';
    for (const [k, v] of Object.entries(CROP_URDU)) {
      if (cleanCrop.includes(k)) {
        crop_ur = v;
        break;
      }
    }

    // Default benchmarks per acre
    const defaultYield = cleanCrop.includes('cotton') ? 24 : cleanCrop.includes('rice') ? 42 : cleanCrop.includes('maize') ? 75 : cleanCrop.includes('potato') ? 250 : cleanCrop.includes('chickpea') ? 18 : cleanCrop.includes('mustard') || cleanCrop.includes('canola') ? 22 : 38;
    const defaultPrice = cleanCrop.includes('cotton') ? 8200 : cleanCrop.includes('rice') ? 4200 : cleanCrop.includes('maize') ? 2650 : cleanCrop.includes('potato') ? 1350 : cleanCrop.includes('chickpea') ? 7600 : cleanCrop.includes('mustard') || cleanCrop.includes('canola') ? 7100 : 3900;

    const expected_yield_per_acre = Number(body.expected_yield_per_acre || body.target_yield || defaultYield);
    const mandi_price = Number(body.mandi_price || body.market_price || defaultPrice);

    // Per acre costs (PKR)
    const seed_cost_per_acre = body.seed_cost !== undefined ? Number(body.seed_cost) : (cleanCrop.includes('potato') ? 65000 : cleanCrop.includes('cotton') ? 12000 : 7500);
    const fert_cost_per_acre = body.fertilizer_cost !== undefined ? Number(body.fertilizer_cost) : (cleanCrop.includes('potato') ? 48000 : cleanCrop.includes('cotton') ? 32000 : 24000);
    const pest_cost_per_acre = body.pesticide_cost !== undefined ? Number(body.pesticide_cost) : (cleanCrop.includes('cotton') ? 28000 : cleanCrop.includes('potato') ? 24000 : 5000);
    const irrig_cost_per_acre = body.irrigation_cost !== undefined ? Number(body.irrigation_cost) : (cleanCrop.includes('rice') ? 28000 : cleanCrop.includes('potato') ? 22000 : 12000);
    const labor_cost_per_acre = body.labor_cost !== undefined ? Number(body.labor_cost) : (cleanCrop.includes('cotton') ? 22000 : cleanCrop.includes('potato') ? 25000 : 10000);
    const other_cost_per_acre = body.other_costs !== undefined ? Number(body.other_costs) : 4000;

    const total_cost_per_acre = seed_cost_per_acre + fert_cost_per_acre + pest_cost_per_acre + irrig_cost_per_acre + labor_cost_per_acre + other_cost_per_acre;
    const total_cost = Math.round(total_cost_per_acre * acres);

    const expected_production = Math.round(expected_yield_per_acre * acres);
    const gross_revenue = Math.round(expected_production * mandi_price);
    const net_profit = gross_revenue - total_cost;
    const profit_per_acre = Math.round(net_profit / acres);
    const return_on_investment_percent = total_cost > 0 ? Math.round((net_profit / total_cost) * 100) : 0;
    const is_profitable = net_profit >= 0;
    const break_even_yield = mandi_price > 0 ? Number((total_cost_per_acre / mandi_price).toFixed(1)) : 0;

    const cost_breakdown = {
      seed: Math.round(seed_cost_per_acre * acres),
      fertilizer: Math.round(fert_cost_per_acre * acres),
      pesticide: Math.round(pest_cost_per_acre * acres),
      irrigation: Math.round(irrig_cost_per_acre * acres),
      labor: Math.round(labor_cost_per_acre * acres),
      other: Math.round(other_cost_per_acre * acres),
      land_preparation: Math.round(other_cost_per_acre * acres),
      seeds: Math.round(seed_cost_per_acre * acres),
      harvesting: Math.round(labor_cost_per_acre * acres),
    };

    // Sensitivity scenarios
    const scenarios = [
      {
        scenario: 'Pessimistic (-20% Yield Shock)',
        yield_maunds_per_acre: Number((expected_yield_per_acre * 0.8).toFixed(1)),
        mandi_price_pkr: mandi_price,
        gross_revenue_pkr: Math.round(expected_yield_per_acre * 0.8 * acres * mandi_price),
        net_profit_pkr: Math.round(expected_yield_per_acre * 0.8 * acres * mandi_price) - total_cost,
        profit_per_acre_pkr: Math.round((Math.round(expected_yield_per_acre * 0.8 * acres * mandi_price) - total_cost) / acres),
      },
      {
        scenario: 'Soft Market (-10% Mandi Price Drop)',
        yield_maunds_per_acre: expected_yield_per_acre,
        mandi_price_pkr: Math.round(mandi_price * 0.9),
        gross_revenue_pkr: Math.round(expected_production * mandi_price * 0.9),
        net_profit_pkr: Math.round(expected_production * mandi_price * 0.9) - total_cost,
        profit_per_acre_pkr: Math.round((Math.round(expected_production * mandi_price * 0.9) - total_cost) / acres),
      },
      {
        scenario: 'Base Plan',
        yield_maunds_per_acre: expected_yield_per_acre,
        mandi_price_pkr: mandi_price,
        gross_revenue_pkr: gross_revenue,
        net_profit_pkr: net_profit,
        profit_per_acre_pkr: profit_per_acre,
      },
      {
        scenario: 'Strong Demand (+10% Mandi Price Rally)',
        yield_maunds_per_acre: expected_yield_per_acre,
        mandi_price_pkr: Math.round(mandi_price * 1.1),
        gross_revenue_pkr: Math.round(expected_production * mandi_price * 1.1),
        net_profit_pkr: Math.round(expected_production * mandi_price * 1.1) - total_cost,
        profit_per_acre_pkr: Math.round((Math.round(expected_production * mandi_price * 1.1) - total_cost) / acres),
      },
      {
        scenario: 'High Harvest (+20% Bumper Yield)',
        yield_maunds_per_acre: Number((expected_yield_per_acre * 1.2).toFixed(1)),
        mandi_price_pkr: mandi_price,
        gross_revenue_pkr: Math.round(expected_yield_per_acre * 1.2 * acres * mandi_price),
        net_profit_pkr: Math.round(expected_yield_per_acre * 1.2 * acres * mandi_price) - total_cost,
        profit_per_acre_pkr: Math.round((Math.round(expected_yield_per_acre * 1.2 * acres * mandi_price) - total_cost) / acres),
      },
    ];

    return NextResponse.json({
      crop,
      crop_ur,
      acres,
      expected_yield_per_acre,
      expected_production,
      expected_yield_total_maunds: expected_production,
      mandi_price,
      gross_revenue,
      gross_revenue_pkr: gross_revenue,
      expected_gross_revenue_pkr: gross_revenue,
      total_cost,
      total_cost_pkr: total_cost,
      total_input_cost_pkr: total_cost,
      cost_per_acre: total_cost_per_acre,
      net_profit,
      net_profit_pkr: net_profit,
      net_margin_pkr: net_profit,
      profit_per_acre,
      break_even_yield,
      return_on_investment_percent,
      roi_percentage: return_on_investment_percent,
      profit_margin_percent: return_on_investment_percent,
      is_profitable,
      cost_breakdown,
      sensitivity_analysis: scenarios,
      disclaimer: 'Calculated using Punjab Agricultural Economics benchmarks and AMIS market wholesale prices.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to calculate profit', details: err.message }, { status: 500 });
  }
}
