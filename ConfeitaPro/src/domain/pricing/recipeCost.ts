type Unit = 'g' | 'kg' | 'ml' | 'l' | 'un';

const toBase: Record<Unit, number> = { g: 1, kg: 1000, ml: 1, l: 1000, un: 1 };

function family(u: Unit): 'mass' | 'vol' | 'un' {
  if (u === 'g' || u === 'kg') return 'mass';
  if (u === 'ml' || u === 'l') return 'vol';
  return 'un';
}

export function convert(qty: number, from: Unit, to: Unit): number {
  if (from === to) return qty;
  if (family(from) !== family(to)) {
    throw new Error(`Unidades incompatíveis: ${from} → ${to}`);
  }
  return (qty * toBase[from]) / toBase[to];
}

export interface RecipeIngredientInput {
  qty: number;
  unit: Unit;
  ingredient: {
    unit: Unit;
    packageQty: number;
    packageCostCents: number;
  };
}

export interface RecipeCostInput {
  ingredients: RecipeIngredientInput[];
  laborCostCents: number;
  fixedCostCents: number;
  yieldQty: number;
  marginPct: number;
}

export interface RecipeCostResult {
  ingredientsCostCents: number;
  totalCostCents: number;
  costPerYieldUnitCents: number;
  suggestedPriceCents: number;
  marginCents: number;
}

export function calculateRecipeCost(input: RecipeCostInput): RecipeCostResult {
  let ingredientsCostCents = 0;

  for (const item of input.ingredients) {
    // converte a quantidade usada para a unidade da embalagem comprada
    const qtyInIngredientUnit = convert(item.qty, item.unit, item.ingredient.unit);
    const costPerUnit = item.ingredient.packageCostCents / item.ingredient.packageQty;
    ingredientsCostCents += qtyInIngredientUnit * costPerUnit;
  }

  ingredientsCostCents = Math.round(ingredientsCostCents);
  const totalCostCents = ingredientsCostCents + input.laborCostCents + input.fixedCostCents;
  const costPerYieldUnitCents = Math.round(totalCostCents / input.yieldQty);

  const marginMultiplier = 1 + input.marginPct / 100;
  const suggestedPriceCents = Math.round(costPerYieldUnitCents * marginMultiplier);
  const marginCents = suggestedPriceCents - costPerYieldUnitCents;

  return {
    ingredientsCostCents,
    totalCostCents,
    costPerYieldUnitCents,
    suggestedPriceCents,
    marginCents,
  };
}
