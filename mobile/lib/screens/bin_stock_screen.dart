import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import 'item_details_screen.dart';

class BinStockScreen extends ConsumerStatefulWidget {
  final String binLocationId;
  final String binCode;

  const BinStockScreen({
    super.key,
    required this.binLocationId,
    required this.binCode,
  });

  @override
  ConsumerState<BinStockScreen> createState() => _BinStockScreenState();
}

class _BinStockScreenState extends ConsumerState<BinStockScreen> {
  final ApiClient _apiClient = ApiClient();

  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _binData;
  List<Map<String, dynamic>> _stockItems = [];

  @override
  void initState() {
    super.initState();
    _loadBinStock();
  }

  Future<void> _loadBinStock() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Fetch stock levels for this bin location
      final response = await _apiClient.dio.get(
        '/inventory/stock-levels',
        queryParameters: {
          'binLocationId': widget.binLocationId,
        },
      );

      final data = response.data['data'];
      if (data is List) {
        _stockItems = data.cast<Map<String, dynamic>>();
      }

      // Try to fetch bin details
      try {
        // The bin info may be embedded in the stock levels response
        // or we can get it from the first item
        if (_stockItems.isNotEmpty) {
          _binData = {
            'code': widget.binCode,
            'zone': _stockItems.first['zone'] ??
                _stockItems.first['binZone'] ??
                '',
            'warehouseName': _stockItems.first['warehouseName'] ?? '',
          };
        }
      } catch (_) {
        // Bin data is optional
      }

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Failed to load bin stock';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.binCode),
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
                        onPressed: _loadBinStock,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadBinStock,
                  child: Column(
                    children: [
                      // Bin info header
                      _buildBinInfoHeader(),

                      // Items list
                      Expanded(
                        child: _stockItems.isEmpty
                            ? const Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.inventory_2_outlined,
                                      size: 48,
                                      color: AppColors.textTertiary,
                                    ),
                                    SizedBox(height: 16),
                                    Text(
                                      'No items in this bin',
                                      style: AppTypography.body,
                                    ),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.md,
                                ),
                                itemCount: _stockItems.length,
                                itemBuilder: (context, index) {
                                  final item = _stockItems[index];
                                  return _BinStockItemCard(
                                    item: item,
                                    onTap: () {
                                      final itemId =
                                          item['itemId'] as String? ?? '';
                                      if (itemId.isNotEmpty) {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => ItemDetailsScreen(
                                              itemId: itemId,
                                            ),
                                          ),
                                        );
                                      }
                                    },
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildBinInfoHeader() {
    final zone = _binData?['zone'] as String? ?? '';
    final warehouseName = _binData?['warehouseName'] as String? ?? '';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      margin: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.primaryBg,
        borderRadius: AppRadius.borderLg,
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.15),
              borderRadius: AppRadius.borderLg,
            ),
            child: const Icon(
              Icons.location_on,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.binCode,
                  style: AppTypography.h4.copyWith(color: AppColors.primary),
                ),
                if (zone.isNotEmpty)
                  Text(
                    'Zone: $zone',
                    style: AppTypography.small,
                  ),
                if (warehouseName.isNotEmpty)
                  Text(
                    warehouseName,
                    style: AppTypography.caption,
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${_stockItems.length}',
                style: AppTypography.h3.copyWith(color: AppColors.primary),
              ),
              Text(
                _stockItems.length == 1 ? 'item' : 'items',
                style: AppTypography.caption,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BinStockItemCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onTap;

  const _BinStockItemCard({
    required this.item,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final itemName = item['itemName'] as String? ?? 'Unknown Item';
    final itemCode = item['itemCode'] as String? ?? '';
    final quantity =
        item['onHand'] as int? ?? item['quantity'] as int? ?? 0;
    final committed =
        item['committed'] as int? ?? item['reservedQuantity'] as int? ?? 0;
    final available = quantity - committed;

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.borderLg,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(itemName, style: AppTypography.bodyMedium),
                    const SizedBox(height: 2),
                    Text(
                      itemCode,
                      style: AppTypography.mono.copyWith(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: available <= 0
                          ? AppColors.errorBg
                          : available < 10
                              ? AppColors.warningBg
                              : AppColors.successBg,
                      borderRadius: AppRadius.borderSm,
                    ),
                    child: Text(
                      available.toString(),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: available <= 0
                            ? AppColors.error
                            : available < 10
                                ? AppColors.warning
                                : AppColors.success,
                      ),
                    ),
                  ),
                  if (committed > 0) ...[
                    const SizedBox(height: 4),
                    Text(
                      '$committed committed',
                      style: AppTypography.caption.copyWith(fontSize: 11),
                    ),
                  ],
                ],
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.chevron_right,
                size: 18,
                color: AppColors.textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
