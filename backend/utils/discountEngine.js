/**
 * Deterministic integer cent calculation for line items and global ticket discounts
 * Avoids IEEE 754 floating-point inaccuracies
 */
exports.calculateCartFinancials = ({ items = [], globalDiscount = null }) => {
  let rawSubtotalInCents = 0;
  let totalLineDiscountInCents = 0;

  const processedItems = items.map((item) => {
    const unitPrice = Math.round(Number(item.unitPriceInCents) || 0);
    const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
    const lineRawTotal = unitPrice * quantity;
    rawSubtotalInCents += lineRawTotal;

    let lineDiscountInCents = 0;
    const discountType = item.lineDiscountType || 'none';
    const discountValue = Number(item.lineDiscountValue) || 0;

    if (discountType === 'percentage' && discountValue > 0) {
      lineDiscountInCents = Math.round((lineRawTotal * discountValue) / 100);
    } else if (discountType === 'fixed_cents' && discountValue > 0) {
      lineDiscountInCents = Math.min(lineRawTotal, Math.round(discountValue));
    }

    // Discount cannot exceed the line item total
    lineDiscountInCents = Math.min(lineRawTotal, Math.max(0, lineDiscountInCents));
    const finalLineTotalInCents = lineRawTotal - lineDiscountInCents;
    totalLineDiscountInCents += lineDiscountInCents;

    return {
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      skuSnapshot: item.skuSnapshot,
      categoryNameSnapshot: item.categoryNameSnapshot || '',
      unitPriceInCents: unitPrice,
      quantity,
      lineDiscountType: discountType,
      lineDiscountValue: discountValue,
      lineDiscountInCents,
      finalLineTotalInCents,
      takenAt: item.takenAt ? new Date(item.takenAt) : new Date()
    };
  });

  const netLineSubtotalInCents = rawSubtotalInCents - totalLineDiscountInCents;

  let globalDiscountInCents = 0;
  const globalType = globalDiscount?.type || 'none';
  const globalValue = Number(globalDiscount?.value) || 0;

  if (globalType === 'percentage' && globalValue > 0) {
    globalDiscountInCents = Math.round((netLineSubtotalInCents * globalValue) / 100);
  } else if (globalType === 'fixed_cents' && globalValue > 0) {
    globalDiscountInCents = Math.min(netLineSubtotalInCents, Math.round(globalValue));
  }
  globalDiscountInCents = Math.min(netLineSubtotalInCents, Math.max(0, globalDiscountInCents));

  const grandTotalInCents = Math.max(0, netLineSubtotalInCents - globalDiscountInCents);

  return {
    processedItems,
    subtotalInCents: rawSubtotalInCents,
    totalDiscountInCents: totalLineDiscountInCents + globalDiscountInCents,
    globalDiscountInCents,
    grandTotalInCents
  };
};
