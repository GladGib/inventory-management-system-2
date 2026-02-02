class Item {
  final String id;
  final String code;
  final String name;
  final String? description;
  final String? barcode;
  final String? categoryId;
  final String? categoryName;
  final double costPrice;
  final double sellingPrice;
  final String uom;
  final int stockQuantity;
  final int reorderPoint;
  final int reorderQuantity;
  final bool isActive;

  Item({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    this.barcode,
    this.categoryId,
    this.categoryName,
    required this.costPrice,
    required this.sellingPrice,
    required this.uom,
    required this.stockQuantity,
    required this.reorderPoint,
    required this.reorderQuantity,
    required this.isActive,
  });

  bool get isLowStock => stockQuantity <= reorderPoint;

  factory Item.fromJson(Map<String, dynamic> json) {
    return Item(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      barcode: json['barcode'] as String?,
      categoryId: json['categoryId'] as String?,
      categoryName: json['category']?['name'] as String?,
      costPrice: (json['costPrice'] as num).toDouble(),
      sellingPrice: (json['sellingPrice'] as num).toDouble(),
      uom: json['uom'] as String? ?? 'PCS',
      stockQuantity: json['stockQuantity'] as int? ?? 0,
      reorderPoint: json['reorderPoint'] as int? ?? 0,
      reorderQuantity: json['reorderQuantity'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
      'description': description,
      'barcode': barcode,
      'categoryId': categoryId,
      'costPrice': costPrice,
      'sellingPrice': sellingPrice,
      'uom': uom,
      'reorderPoint': reorderPoint,
      'reorderQuantity': reorderQuantity,
      'isActive': isActive,
    };
  }
}

class StockLevel {
  final String itemId;
  final String itemCode;
  final String itemName;
  final String warehouseId;
  final String warehouseName;
  final int quantity;
  final int reservedQuantity;
  final int availableQuantity;
  final String? binLocationCode;

  StockLevel({
    required this.itemId,
    required this.itemCode,
    required this.itemName,
    required this.warehouseId,
    required this.warehouseName,
    required this.quantity,
    required this.reservedQuantity,
    required this.availableQuantity,
    this.binLocationCode,
  });

  factory StockLevel.fromJson(Map<String, dynamic> json) {
    return StockLevel(
      itemId: json['itemId'] as String,
      itemCode: json['itemCode'] as String,
      itemName: json['itemName'] as String,
      warehouseId: json['warehouseId'] as String,
      warehouseName: json['warehouseName'] as String,
      quantity: json['quantity'] as int,
      reservedQuantity: json['reservedQuantity'] as int? ?? 0,
      availableQuantity: json['availableQuantity'] as int,
      binLocationCode: json['binLocationCode'] as String?,
    );
  }
}
