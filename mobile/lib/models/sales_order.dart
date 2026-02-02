enum SalesOrderStatus {
  draft,
  confirmed,
  processing,
  shipped,
  delivered,
  cancelled;

  static SalesOrderStatus fromString(String value) {
    return SalesOrderStatus.values.firstWhere(
      (e) => e.name.toUpperCase() == value.toUpperCase(),
      orElse: () => SalesOrderStatus.draft,
    );
  }

  String get displayName {
    switch (this) {
      case SalesOrderStatus.draft:
        return 'Draft';
      case SalesOrderStatus.confirmed:
        return 'Confirmed';
      case SalesOrderStatus.processing:
        return 'Processing';
      case SalesOrderStatus.shipped:
        return 'Shipped';
      case SalesOrderStatus.delivered:
        return 'Delivered';
      case SalesOrderStatus.cancelled:
        return 'Cancelled';
    }
  }
}

class SalesOrderItem {
  final String id;
  final String itemId;
  final String itemCode;
  final String itemName;
  final int quantity;
  final int pickedQuantity;
  final double unitPrice;
  final double lineTotal;
  final String? binLocation;

  SalesOrderItem({
    required this.id,
    required this.itemId,
    required this.itemCode,
    required this.itemName,
    required this.quantity,
    required this.pickedQuantity,
    required this.unitPrice,
    required this.lineTotal,
    this.binLocation,
  });

  int get remainingToPick => quantity - pickedQuantity;
  bool get isFullyPicked => pickedQuantity >= quantity;

  factory SalesOrderItem.fromJson(Map<String, dynamic> json) {
    return SalesOrderItem(
      id: json['id'] as String,
      itemId: json['itemId'] as String,
      itemCode: json['itemCode'] as String,
      itemName: json['itemName'] as String,
      quantity: json['quantity'] as int,
      pickedQuantity: json['pickedQuantity'] as int? ?? 0,
      unitPrice: (json['unitPrice'] as num).toDouble(),
      lineTotal: (json['lineTotal'] as num).toDouble(),
      binLocation: json['binLocation'] as String?,
    );
  }
}

class SalesOrder {
  final String id;
  final String orderNumber;
  final String customerId;
  final String customerName;
  final String warehouseId;
  final String warehouseName;
  final DateTime orderDate;
  final DateTime? expectedDeliveryDate;
  final SalesOrderStatus status;
  final double totalAmount;
  final String? notes;
  final List<SalesOrderItem> items;

  SalesOrder({
    required this.id,
    required this.orderNumber,
    required this.customerId,
    required this.customerName,
    required this.warehouseId,
    required this.warehouseName,
    required this.orderDate,
    this.expectedDeliveryDate,
    required this.status,
    required this.totalAmount,
    this.notes,
    required this.items,
  });

  int get totalItems => items.length;
  int get totalQuantity => items.fold(0, (sum, item) => sum + item.quantity);
  int get totalPicked => items.fold(0, (sum, item) => sum + item.pickedQuantity);
  bool get isFullyPicked => items.every((item) => item.isFullyPicked);

  factory SalesOrder.fromJson(Map<String, dynamic> json) {
    return SalesOrder(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      customerId: json['customerId'] as String,
      customerName: json['customer']?['name'] as String? ?? '',
      warehouseId: json['warehouseId'] as String,
      warehouseName: json['warehouse']?['name'] as String? ?? '',
      orderDate: DateTime.parse(json['orderDate'] as String),
      expectedDeliveryDate: json['expectedDeliveryDate'] != null
          ? DateTime.parse(json['expectedDeliveryDate'] as String)
          : null,
      status: SalesOrderStatus.fromString(json['status'] as String),
      totalAmount: (json['totalAmount'] as num).toDouble(),
      notes: json['notes'] as String?,
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => SalesOrderItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class PickListItem {
  final String itemId;
  final String itemCode;
  final String itemName;
  final int orderedQuantity;
  int pickedQuantity;
  final String? binLocation;

  PickListItem({
    required this.itemId,
    required this.itemCode,
    required this.itemName,
    required this.orderedQuantity,
    required this.pickedQuantity,
    this.binLocation,
  });

  int get remainingToPick => orderedQuantity - pickedQuantity;

  factory PickListItem.fromJson(Map<String, dynamic> json) {
    return PickListItem(
      itemId: json['itemId'] as String,
      itemCode: json['itemCode'] as String,
      itemName: json['itemName'] as String,
      orderedQuantity: json['orderedQuantity'] as int,
      pickedQuantity: json['pickedQuantity'] as int? ?? 0,
      binLocation: json['binLocation'] as String?,
    );
  }
}
