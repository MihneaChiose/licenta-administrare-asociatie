export function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

export function toMoneyString(value: number) {
  return roundToTwoDecimals(value).toFixed(2);
}

type WeightedItem = {
  id: string;
  weight: number;
};

type AllocateByWeightOptions = {
  remainderToLastPositive?: boolean;
};

export function allocateByWeight(
  items: WeightedItem[],
  totalAmount: number,
  options: AllocateByWeightOptions = {},
): Map<string, number> {
  if (items.length === 0) {
    return new Map();
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight <= 0) {
    return new Map(items.map((item) => [item.id, 0]));
  }

  let remainderTargetIndex = items.length - 1;

  if (options.remainderToLastPositive) {
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (items[index].weight > 0) {
        remainderTargetIndex = index;
        break;
      }
    }
  }

  const allocations = new Map<string, number>();

  let alreadyAllocated = 0;

  items.forEach((item, index) => {
    if (index === remainderTargetIndex) {
      return;
    }

    const amount = roundToTwoDecimals(
      (totalAmount * item.weight) / totalWeight,
    );

    allocations.set(item.id, amount);

    alreadyAllocated += amount;
  });

  const remainderTarget = items[remainderTargetIndex];

  allocations.set(
    remainderTarget.id,
    roundToTwoDecimals(totalAmount - alreadyAllocated),
  );

  return allocations;
}
