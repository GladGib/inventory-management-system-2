enum AdjustmentType {
  add,
  subtract,
  damage,
  expired,
  theft,
  correction,
  opening;

  static AdjustmentType fromString(String value) {
    return AdjustmentType.values.firstWhere(
      (e) => e.name.toUpperCase() == value.toUpperCase(),
      orElse: () => AdjustmentType.correction,
    );
  }

  String get displayName {
    switch (this) {
      case AdjustmentType.add:
        return 'Add Stock';
      case AdjustmentType.subtract:
        return 'Remove Stock';
      case AdjustmentType.damage:
        return 'Damaged';
      case AdjustmentType.expired:
        return 'Expired';
      case AdjustmentType.theft:
        return 'Theft/Loss';
      case AdjustmentType.correction:
        return 'Correction';
      case AdjustmentType.opening:
        return 'Opening Balance';
    }
  }

  bool get isAddition => this == AdjustmentType.add || this == AdjustmentType.opening;
}

class StockAdjustmentItem {
  final String itemId;
  final String itemCode;
  final String itemName;
  int quantity;
  String? binLocationId;

  StockAdjustmentItem({
    required this.itemId,
    required this.itemCode,
    required this.itemName,
    required this.quantity,
    this.binLocationId,
  });

  Map<String, dynamic> toJson() {
    return {
      'itemId': itemId,
      'quantity': quantity,
      'binLocationId': binLocationId,
    };
  }
}

class CreateStockAdjustmentRequest {
  final String warehouseId;
  final AdjustmentType type;
  final String reason;
  final String? notes;
  final List<StockAdjustmentItem> items;

  CreateStockAdjustmentRequest({
    required this.warehouseId,
    required this.type,
    required this.reason,
    this.notes,
    required this.items,
  });

  Map<String, dynamic> toJson() {
    return {
      'warehouseId': warehouseId,
      'type': type.name.toUpperCase(),
      'reason': reason,
      'notes': notes,
      'items': items.map((e) => e.toJson()).toList(),
    };
  }
}
