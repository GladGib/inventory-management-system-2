enum PurchaseOrderStatus {
  draft,
  sent,
  confirmed,
  partial,
  received,
  cancelled;

  static PurchaseOrderStatus fromString(String value) {
    return PurchaseOrderStatus.values.firstWhere(
      (e) => e.name.toUpperCase() == value.toUpperCase(),
      orElse: () => PurchaseOrderStatus.draft,
    );
  }

  String get displayName {
    switch (this) {
      case PurchaseOrderStatus.draft:
        return 'Draft';
      case PurchaseOrderStatus.sent:
        return 'Sent';
      case PurchaseOrderStatus.confirmed:
        return 'Confirmed';
      case PurchaseOrderStatus.partial:
        return 'Partial';
      case PurchaseOrderStatus.received:
        return 'Received';
      case PurchaseOrderStatus.cancelled:
        return 'Cancelled';
    }
  }
}

class PurchaseOrderItem {
  final String id;
  final String itemId;
  final String itemCode;
  final String itemName;
  final int quantity;
  final int receivedQuantity;
  final double unitCost;
  final double lineTotal;

  PurchaseOrderItem({
    required this.id,
    required this.itemId,
    required this.itemCode,
    required this.itemName,
    required this.quantity,
    required this.receivedQuantity,
    required this.unitCost,
    required this.lineTotal,
  });

  int get remainingToReceive => quantity - receivedQuantity;
  bool get isFullyReceived => receivedQuantity >= quantity;

  factory PurchaseOrderItem.fromJson(Map<String, dynamic> json) {
    return PurchaseOrderItem(
      id: json['id'] as String,
      itemId: json['itemId'] as String,
      itemCode: json['itemCode'] as String,
      itemName: json['itemName'] as String,
      quantity: json['quantity'] as int,
      receivedQuantity: json['receivedQuantity'] as int? ?? 0,
      unitCost: (json['unitCost'] as num).toDouble(),
      lineTotal: (json['lineTotal'] as num).toDouble(),
    );
  }
}

class PurchaseOrder {
  final String id;
  final String orderNumber;
  final String vendorId;
  final String vendorName;
  final String warehouseId;
  final String warehouseName;
  final DateTime orderDate;
  final DateTime? expectedDate;
  final PurchaseOrderStatus status;
  final double totalAmount;
  final String? notes;
  final List<PurchaseOrderItem> items;

  PurchaseOrder({
    required this.id,
    required this.orderNumber,
    required this.vendorId,
    required this.vendorName,
    required this.warehouseId,
    required this.warehouseName,
    required this.orderDate,
    this.expectedDate,
    required this.status,
    required this.totalAmount,
    this.notes,
    required this.items,
  });

  int get totalItems => items.length;
  int get totalQuantity => items.fold(0, (sum, item) => sum + item.quantity);
  int get totalReceived => items.fold(0, (sum, item) => sum + item.receivedQuantity);
  bool get isFullyReceived => items.every((item) => item.isFullyReceived);

  factory PurchaseOrder.fromJson(Map<String, dynamic> json) {
    return PurchaseOrder(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      vendorId: json['vendorId'] as String,
      vendorName: json['vendor']?['name'] as String? ?? '',
      warehouseId: json['warehouseId'] as String,
      warehouseName: json['warehouse']?['name'] as String? ?? '',
      orderDate: DateTime.parse(json['orderDate'] as String),
      expectedDate: json['expectedDate'] != null
          ? DateTime.parse(json['expectedDate'] as String)
          : null,
      status: PurchaseOrderStatus.fromString(json['status'] as String),
      totalAmount: (json['totalAmount'] as num).toDouble(),
      notes: json['notes'] as String?,
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => PurchaseOrderItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class GRNItem {
  final String itemId;
  final String itemCode;
  final String itemName;
  final int orderedQuantity;
  final int previouslyReceived;
  int receivingQuantity;
  String? binLocationId;

  GRNItem({
    required this.itemId,
    required this.itemCode,
    required this.itemName,
    required this.orderedQuantity,
    required this.previouslyReceived,
    required this.receivingQuantity,
    this.binLocationId,
  });

  int get remainingToReceive => orderedQuantity - previouslyReceived;
}
