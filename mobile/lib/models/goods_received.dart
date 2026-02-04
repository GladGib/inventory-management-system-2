enum GRNStatus {
  draft,
  confirmed;

  static GRNStatus fromString(String value) {
    switch (value.toUpperCase()) {
      case 'CONFIRMED':
        return GRNStatus.confirmed;
      default:
        return GRNStatus.draft;
    }
  }

  String get displayName {
    switch (this) {
      case GRNStatus.draft:
        return 'Draft';
      case GRNStatus.confirmed:
        return 'Confirmed';
    }
  }
}

class GRNLine {
  final String id;
  final String itemId;
  final String? itemCode;
  final String? itemName;
  final int orderedQty;
  int receivedQty;
  final String? binLocationId;
  final String? binLocationCode;

  GRNLine({
    required this.id,
    required this.itemId,
    this.itemCode,
    this.itemName,
    required this.orderedQty,
    required this.receivedQty,
    this.binLocationId,
    this.binLocationCode,
  });

  int get remaining => orderedQty - receivedQty;
  bool get isComplete => receivedQty >= orderedQty;

  factory GRNLine.fromJson(Map<String, dynamic> json) {
    return GRNLine(
      id: json['id'] as String,
      itemId: json['itemId'] as String,
      itemCode: json['itemCode'] as String?,
      itemName: json['itemName'] as String?,
      orderedQty: json['orderedQty'] as int? ?? json['quantityOrdered'] as int? ?? 0,
      receivedQty: json['receivedQty'] as int? ?? json['quantityReceived'] as int? ?? 0,
      binLocationId: json['binLocationId'] as String?,
      binLocationCode: json['binLocationCode'] as String?,
    );
  }
}

class GoodsReceivedNote {
  final String id;
  final String grnNumber;
  final String? purchaseOrderId;
  final String? poNumber;
  final String vendorId;
  final String? vendorName;
  final String warehouseId;
  final String? warehouseName;
  final DateTime receiveDate;
  final GRNStatus status;
  final String? notes;
  final DateTime createdAt;
  final List<GRNLine> lines;

  GoodsReceivedNote({
    required this.id,
    required this.grnNumber,
    this.purchaseOrderId,
    this.poNumber,
    required this.vendorId,
    this.vendorName,
    required this.warehouseId,
    this.warehouseName,
    required this.receiveDate,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.lines,
  });

  int get totalItems => lines.length;
  int get totalOrdered => lines.fold(0, (sum, line) => sum + line.orderedQty);
  int get totalReceived => lines.fold(0, (sum, line) => sum + line.receivedQty);

  factory GoodsReceivedNote.fromJson(Map<String, dynamic> json) {
    return GoodsReceivedNote(
      id: json['id'] as String,
      grnNumber: json['grnNumber'] as String,
      purchaseOrderId: json['purchaseOrderId'] as String?,
      poNumber: json['poNumber'] as String?,
      vendorId: json['vendorId'] as String? ?? '',
      vendorName: json['vendorName'] as String?,
      warehouseId: json['warehouseId'] as String? ?? '',
      warehouseName: json['warehouseName'] as String?,
      receiveDate: json['receiveDate'] != null
          ? DateTime.parse(json['receiveDate'] as String)
          : DateTime.now(),
      status: GRNStatus.fromString(json['status'] as String? ?? 'DRAFT'),
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      lines: (json['lines'] as List<dynamic>?)
              ?.map((e) => GRNLine.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
