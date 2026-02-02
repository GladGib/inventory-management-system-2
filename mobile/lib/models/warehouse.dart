class Warehouse {
  final String id;
  final String code;
  final String name;
  final String? address;
  final String? phone;
  final bool isPrimary;
  final bool isActive;

  Warehouse({
    required this.id,
    required this.code,
    required this.name,
    this.address,
    this.phone,
    required this.isPrimary,
    required this.isActive,
  });

  factory Warehouse.fromJson(Map<String, dynamic> json) {
    return Warehouse(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      address: json['address'] as String?,
      phone: json['phone'] as String?,
      isPrimary: json['isPrimary'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}

class BinLocation {
  final String id;
  final String code;
  final String name;
  final String? description;
  final String warehouseId;
  final bool isActive;

  BinLocation({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    required this.warehouseId,
    required this.isActive,
  });

  factory BinLocation.fromJson(Map<String, dynamic> json) {
    return BinLocation(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      warehouseId: json['warehouseId'] as String,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}
