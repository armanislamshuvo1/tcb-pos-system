import { create } from 'zustand';

const calculateLineFinancials = (unitPriceInCents, quantity, discountType, discountValue) => {
  const lineRaw = unitPriceInCents * quantity;
  let discountInCents = 0;

  if (discountType === 'percentage' && discountValue > 0) {
    discountInCents = Math.round((lineRaw * discountValue) / 100);
  } else if (discountType === 'fixed_cents' && discountValue > 0) {
    discountInCents = Math.min(lineRaw, Math.round(discountValue));
  }

  discountInCents = Math.min(lineRaw, Math.max(0, discountInCents));
  const lineFinal = lineRaw - discountInCents;

  return {
    lineDiscountInCents: discountInCents,
    finalLineTotalInCents: lineFinal
  };
};

export const useCartStore = create((set, get) => ({
  items: [],
  globalDiscount: { type: 'none', value: 0 },
  customer: null, // Attached customer { _id, name, phone } or custom { name }
  staffMember: null, // Attached staff member for tab
  notes: '',

  setCustomer: (customer) => set({ customer }),
  setStaffMember: (staff) => set({ staffMember: staff }),

  setNotes: (notes) => set({ notes }),

  addItem: (product) => {
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.productId === product._id);

      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        const existing = updatedItems[existingIndex];
        const newQty = existing.quantity + 1;
        const financials = calculateLineFinancials(
          existing.unitPriceInCents,
          newQty,
          existing.lineDiscountType,
          existing.lineDiscountValue
        );

        updatedItems[existingIndex] = {
          ...existing,
          quantity: newQty,
          ...financials
        };

        return { items: updatedItems };
      }

      const initialQty = 1;
      const financials = calculateLineFinancials(product.priceInCents, initialQty, 'none', 0);

      const newItem = {
        productId: product._id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        categoryNameSnapshot: product.categoryNameSnapshot || product.categoryId?.name || '',
        unitPriceInCents: product.priceInCents,
        quantity: initialQty,
        lineDiscountType: 'none',
        lineDiscountValue: 0,
        ...financials
      };

      return { items: [...state.items, newItem] };
    });
  },

  updateQuantity: (productId, delta) => {
    set((state) => {
      const updatedItems = state.items
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;

            const financials = calculateLineFinancials(
              item.unitPriceInCents,
              newQty,
              item.lineDiscountType,
              item.lineDiscountValue
            );

            return {
              ...item,
              quantity: newQty,
              ...financials
            };
          }
          return item;
        })
        .filter(Boolean);

      return { items: updatedItems };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId)
    }));
  },

  setLineDiscount: (productId, type, value) => {
    set((state) => {
      const updatedItems = state.items.map((item) => {
        if (item.productId === productId) {
          const financials = calculateLineFinancials(item.unitPriceInCents, item.quantity, type, value);
          return {
            ...item,
            lineDiscountType: type,
            lineDiscountValue: value,
            ...financials
          };
        }
        return item;
      });

      return { items: updatedItems };
    });
  },

  setGlobalDiscount: (type, value) => {
    set({
      globalDiscount: {
        type: type || 'none',
        value: Number(value) || 0
      }
    });
  },

  clearCart: () => {
    set({
      items: [],
      globalDiscount: { type: 'none', value: 0 },
      customer: null,
      staffMember: null,
      notes: ''
    });
  },

  getTotals: () => {
    const state = get();
    let rawSubtotalInCents = 0;
    let totalLineDiscountInCents = 0;

    for (const item of state.items) {
      rawSubtotalInCents += item.unitPriceInCents * item.quantity;
      totalLineDiscountInCents += item.lineDiscountInCents;
    }

    const netSubtotal = rawSubtotalInCents - totalLineDiscountInCents;

    let globalDiscountInCents = 0;
    if (state.globalDiscount.type === 'percentage' && state.globalDiscount.value > 0) {
      globalDiscountInCents = Math.round((netSubtotal * state.globalDiscount.value) / 100);
    } else if (state.globalDiscount.type === 'fixed_cents' && state.globalDiscount.value > 0) {
      globalDiscountInCents = Math.min(netSubtotal, Math.round(state.globalDiscount.value));
    }

    globalDiscountInCents = Math.min(netSubtotal, Math.max(0, globalDiscountInCents));
    const grandTotalInCents = Math.max(0, netSubtotal - globalDiscountInCents);

    return {
      rawSubtotalInCents,
      totalLineDiscountInCents,
      globalDiscountInCents,
      totalDiscountInCents: totalLineDiscountInCents + globalDiscountInCents,
      grandTotalInCents,
      itemCount: state.items.reduce((acc, item) => acc + item.quantity, 0)
    };
  }
}));
