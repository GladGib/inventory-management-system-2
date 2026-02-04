enum PickListStatus {
  pending,
  inProgress,
  completed;

  static PickListStatus fromString(String value) {
    switch (value.toUpperCase()) {
      case 'IN_PROGRESS':
        return PickListStatus.inProgress;
      case 'COMPLETED':
        return PickListStatus.completed;
      default:
        return PickListStatus.pending;
    }
  }

  String get displayName {
    switch (this) {
      case PickListStatus.pending:
        return 'Pending';
      case PickListStatus.inProgress:
        return 'In Progress';
      case PickListStatus.completed:
        return 'Completed';
    }
  }

  String toApiString() {
    switch (this) {
      case PickListStatus.pending:
        return 'PENDING';
      case PickListStatus.inProgress:
        return 'IN_PROGRESS';
      case PickListStatus.completed:
        return 'COMPLETED';
    }
  }
}

class PickListLine {
  final String id;
  final String itemId;
  final String? itemCode;
  final String? itemName;
  final int quantityToPick;
  int quantityPicked;
  final String? binLocationId;
  final String? binLocationCode;

  PickListLine({
    required this.id,
    required this.itemId,
    this.itemCode,
    this.itemName,
    required this.quantityToPick,
    required this.quantityPicked,
    this.binLocationId,
    this.binLocationCode,
  });

  int get remaining => quantityToPick - quantityPicked;
  bool get isComplete => quantityPicked >= quantityToPick;

  factory PickListLine.fromJson(Map<String, dynamic> json) {
    return PickListLine(
      id: json['id'] as String,
      itemId: json['itemId'] as String,
      itemCode: json['itemCode'] as String?,
      itemName: json['itemName'] as String?,
      quantityToPick: json['quantityToPick'] as int,
      quantityPicked: json['quantityPicked'] as int? ?? 0,
      binLocationId: json['binLocationId'] as String?,
      binLocationCode: json['binLocationCode'] as String?,
    );
  }

  Map<String, dynamic> toPickedJson() {
    return {
      'lineId': id,
      'quantityPicked': quantityPicked,
      if (binLocationId != null) 'binLocationId': binLocationId,
    };
  }
}

class PickList {
  final String id;
  final String pickListNumber;
  final String salesOrderId;
  final String? salesOrderNumber;
  final PickListStatus status;
  final DateTime createdAt;
  final DateTime? completedAt;
  final List<PickListLine> lines;

  PickList({
    required this.id,
    required this.pickListNumber,
    required this.salesOrderId,
    this.salesOrderNumber,
    required this.status,
    required this.createdAt,
    this.completedAt,
    required this.lines,
  });

  int get totalItemsToPick => lines.length;
  int get totalQuantityToPick => lines.fold(0, (sum, line) => sum + line.quantityToPick);
  int get totalQuantityPicked => lines.fold(0, (sum, line) => sum + line.quantityPicked);
  bool get isComplete => lines.every((line) => line.isComplete);
  double get progressPercent {
    if (totalQuantityToPick == 0) return 0;
    return (totalQuantityPicked / totalQuantityToPick) * 100;
  }

  factory PickList.fromJson(Map<String, dynamic> json) {
    return PickList(
      id: json['id'] as String,
      pickListNumber: json['pickListNumber'] as String,
      salesOrderId: json['salesOrderId'] as String,
      salesOrderNumber: json['salesOrderNumber'] as String?,
      status: PickListStatus.fromString(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      lines: (json['lines'] as List<dynamic>?)
              ?.map((e) => PickListLine.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
