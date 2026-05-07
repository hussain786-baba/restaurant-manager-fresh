import type {
  RestaurantTableRow,
  CategoryRow,
  MenuItemRow,
  OrderRow,
  OrderItemRow,
  StaffUserRow,
  AlertRow,
} from "@workspace/db";

export function serializeTable(row: RestaurantTableRow) {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    capacity: row.capacity,
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

export function serializeCategory(row: CategoryRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
  };
}

export function serializeMenuItem(
  row: MenuItemRow,
  categoryName: string | null = null,
) {
  return {
    id: row.id,
    categoryId: row.categoryId,
    categoryName,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    imageEmoji: row.imageEmoji,
    isVeg: row.isVeg,
    isAvailable: row.isAvailable,
    isBestseller: row.isBestseller,
    prepTimeMinutes: row.prepTimeMinutes,
    includes: row.includes,
    createdAt: row.createdAt,
  };
}

export function serializeOrderItem(row: OrderItemRow) {
  return {
    id: row.id,
    menuItemId: row.menuItemId,
    name: row.name,
    imageEmoji: row.imageEmoji,
    quantity: row.quantity,
    unitPrice: Number(row.unitPrice),
    lineTotal: Number(row.lineTotal),
    specialInstructions: row.specialInstructions,
  };
}

export function serializeOrder(
  row: OrderRow,
  tableLabel: string,
  items: OrderItemRow[],
) {
  return {
    id: row.id,
    code: row.code,
    tableId: row.tableId,
    tableLabel,
    sessionId: row.sessionId,
    status: row.status,
    items: items.map(serializeOrderItem),
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    tip: Number(row.tip),
    total: Number(row.total),
    guestCount: row.guestCount,
    guestName: row.guestName,
    paymentMethod: row.paymentMethod,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function serializeStaff(row: StaffUserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.createdAt,
  };
}

export function serializeAlert(row: AlertRow, tableLabel: string | null) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    tableLabel,
    orderId: row.orderId,
    createdAt: row.createdAt,
    dismissed: row.dismissed,
  };
}
