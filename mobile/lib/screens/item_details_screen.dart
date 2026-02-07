import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/warehouse.dart';
import '../providers/warehouse_provider.dart';
import 'bin_stock_screen.dart';

class ItemDetailsScreen extends ConsumerStatefulWidget {
  final String itemId;

  const ItemDetailsScreen({
    super.key,
    required this.itemId,
  });

  @override
  ConsumerState<ItemDetailsScreen> createState() => _ItemDetailsScreenState();
}

class _ItemDetailsScreenState extends ConsumerState<ItemDetailsScreen> {
  final ApiClient _apiClient = ApiClient();
  final currencyFormat = NumberFormat.currency(symbol: 'RM ', decimalDigits: 2);

  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _itemData;
  List<Map<String, dynamic>> _stockLevels = [];
  List<Map<String, dynamic>> _variants = [];
  List<Map<String, dynamic>> _images = [];

  @override
  void initState() {
    super.initState();
    _loadItemDetails();
  }

  Future<void> _loadItemDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Fetch item details
      final response = await _apiClient.dio.get('/items/${widget.itemId}');
      _itemData = response.data['data'] as Map<String, dynamic>;

      // Fetch stock levels for this item
      final stockResponse = await _apiClient.dio.get(
        '/items/${widget.itemId}/stock',
      );
      final stockData = stockResponse.data['data'];
      if (stockData is List) {
        _stockLevels = stockData.cast<Map<String, dynamic>>();
      } else if (stockData is Map && stockData.containsKey('levels')) {
        _stockLevels =
            (stockData['levels'] as List).cast<Map<String, dynamic>>();
      }

      // Extract images
      if (_itemData!['images'] != null) {
        _images = (_itemData!['images'] as List).cast<Map<String, dynamic>>();
      }

      // If this is a variant parent, fetch variants
      if (_itemData!['type'] == 'VARIANT_PARENT') {
        try {
          final variantsResponse = await _apiClient.dio.get(
            '/items/${widget.itemId}/variants',
          );
          final variantsData = variantsResponse.data['data'];
          if (variantsData is Map && variantsData.containsKey('variants')) {
            _variants = (variantsData['variants'] as List)
                .cast<Map<String, dynamic>>();
          } else if (variantsData is List) {
            _variants = variantsData.cast<Map<String, dynamic>>();
          }
        } catch (_) {
          // Variants fetch may fail; not critical
        }
      }

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Failed to load item details';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedWarehouse = ref.watch(selectedWarehouseProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_itemData?['name'] ?? 'Item Details'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: AppColors.error),
                      const SizedBox(height: 16),
                      Text(_error!, style: AppTypography.body),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _loadItemDetails,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadItemDetails,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Images section
                        if (_images.isNotEmpty) _buildImagesSection(),

                        // Basic info card
                        _buildBasicInfoCard(),
                        const SizedBox(height: AppSpacing.md),

                        // Pricing card
                        _buildPricingCard(),
                        const SizedBox(height: AppSpacing.md),

                        // Stock levels by bin location
                        _buildStockLevelsSection(selectedWarehouse),
                        const SizedBox(height: AppSpacing.md),

                        // Variants section
                        if (_variants.isNotEmpty) ...[
                          _buildVariantsSection(),
                          const SizedBox(height: AppSpacing.md),
                        ],
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildImagesSection() {
    return SizedBox(
      height: 200,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(bottom: AppSpacing.md),
        itemCount: _images.length,
        itemBuilder: (context, index) {
          final image = _images[index];
          return Container(
            width: 200,
            margin: EdgeInsets.only(
              right: index < _images.length - 1 ? AppSpacing.sm : 0,
            ),
            decoration: BoxDecoration(
              borderRadius: AppRadius.borderLg,
              border: Border.all(color: AppColors.borderLight),
            ),
            child: ClipRRect(
              borderRadius: AppRadius.borderLg,
              child: Image.network(
                image['url'] as String,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Center(
                  child: Icon(
                    Icons.image_not_supported_outlined,
                    size: 48,
                    color: AppColors.textTertiary,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBasicInfoCard() {
    final item = _itemData!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['code'] as String? ?? '',
                        style: AppTypography.mono.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item['name'] as String? ?? '',
                        style: AppTypography.h3,
                      ),
                    ],
                  ),
                ),
                _buildItemTypeBadge(item['type'] as String? ?? 'SIMPLE'),
              ],
            ),
            const Divider(height: 24),
            _DetailRow(
              'Category',
              item['category']?['name'] as String? ?? '-',
            ),
            _DetailRow(
              'Barcode',
              item['barcode'] as String? ?? '-',
            ),
            _DetailRow(
              'Unit of Measure',
              item['uom'] as String? ?? 'PCS',
            ),
            _DetailRow(
              'Reorder Point',
              (item['reorderPoint'] ?? 0).toString(),
            ),
            _DetailRow(
              'Reorder Quantity',
              (item['reorderQty'] ?? 0).toString(),
            ),
            if (item['description'] != null &&
                (item['description'] as String).isNotEmpty) ...[
              const Divider(height: 24),
              const Text(
                'Description',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                item['description'] as String,
                style: AppTypography.body,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildItemTypeBadge(String type) {
    Color color;
    String label;

    switch (type) {
      case 'VARIANT_PARENT':
        color = Colors.purple;
        label = 'Parent';
        break;
      case 'VARIANT':
        color = Colors.indigo;
        label = 'Variant';
        break;
      case 'BUNDLE':
        color = Colors.teal;
        label = 'Bundle';
        break;
      default:
        color = AppColors.primary;
        label = 'Simple';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: AppRadius.borderFull,
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildPricingCard() {
    final item = _itemData!;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Pricing', style: AppTypography.h4),
            const SizedBox(height: 12),
            _DetailRow(
              'Cost Price',
              currencyFormat.format(
                (item['costPrice'] as num?)?.toDouble() ?? 0,
              ),
            ),
            _DetailRow(
              'Selling Price',
              currencyFormat.format(
                (item['sellingPrice'] as num?)?.toDouble() ?? 0,
              ),
            ),
            if (item['wholesalePrice'] != null)
              _DetailRow(
                'Wholesale Price',
                currencyFormat.format(
                  (item['wholesalePrice'] as num).toDouble(),
                ),
              ),
            if (item['minSellingPrice'] != null)
              _DetailRow(
                'Min Selling Price',
                currencyFormat.format(
                  (item['minSellingPrice'] as num).toDouble(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStockLevelsSection(Warehouse? selectedWarehouse) {
    // Filter stock levels by selected warehouse if available
    final filteredLevels = selectedWarehouse != null
        ? _stockLevels
            .where((l) => l['warehouseId'] == selectedWarehouse.id)
            .toList()
        : _stockLevels;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Stock Levels', style: AppTypography.h4),
                if (selectedWarehouse != null)
                  Chip(
                    label: Text(
                      selectedWarehouse.name,
                      style: const TextStyle(fontSize: 11),
                    ),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (filteredLevels.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(
                  child: Text(
                    'No stock in this warehouse',
                    style: AppTypography.small,
                  ),
                ),
              )
            else
              ...filteredLevels.map((level) {
                final binCode =
                    level['binLocationCode'] as String? ?? 'Unassigned';
                final binId = level['binLocationId'] as String?;
                final onHand = level['onHand'] as int? ??
                    level['quantity'] as int? ??
                    0;
                final committed = level['committed'] as int? ??
                    level['reservedQuantity'] as int? ??
                    0;
                final available = onHand - committed;

                return InkWell(
                  onTap: binId != null
                      ? () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BinStockScreen(
                                binLocationId: binId,
                                binCode: binCode,
                              ),
                            ),
                          );
                        }
                      : null,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.sm,
                      horizontal: AppSpacing.xs,
                    ),
                    decoration: const BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: AppColors.divider),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          size: 18,
                          color: AppColors.textTertiary,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                binCode,
                                style: AppTypography.mono.copyWith(
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              if (level['warehouseName'] != null)
                                Text(
                                  level['warehouseName'] as String,
                                  style: AppTypography.caption,
                                ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              available.toString(),
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: available <= 0
                                    ? AppColors.error
                                    : AppColors.text,
                              ),
                            ),
                            if (committed > 0)
                              Text(
                                '$committed committed',
                                style: AppTypography.caption.copyWith(
                                  fontSize: 11,
                                ),
                              ),
                          ],
                        ),
                        if (binId != null) ...[
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.chevron_right,
                            size: 18,
                            color: AppColors.textTertiary,
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildVariantsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Variants (${_variants.length})',
              style: AppTypography.h4,
            ),
            const SizedBox(height: 12),
            ..._variants.map((variant) {
              final name = variant['name'] as String? ?? '';
              final code = variant['code'] as String? ?? '';
              final sellingPrice =
                  (variant['sellingPrice'] as num?)?.toDouble() ?? 0;

              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(name, style: AppTypography.bodyMedium),
                subtitle: Text(
                  code,
                  style: AppTypography.mono.copyWith(fontSize: 12),
                ),
                trailing: Text(
                  currencyFormat.format(sellingPrice),
                  style: AppTypography.bodyMedium,
                ),
                onTap: () {
                  final variantId = variant['id'] as String;
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ItemDetailsScreen(itemId: variantId),
                    ),
                  );
                },
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
