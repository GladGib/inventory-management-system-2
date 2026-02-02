import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/items_provider.dart';
import '../providers/warehouse_provider.dart';
import '../models/item.dart';
import '../core/theme.dart';
import 'package:intl/intl.dart';

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Items'),
            Tab(text: 'Stock Levels'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _ItemsTab(searchController: _searchController),
          const _StockLevelsTab(),
        ],
      ),
    );
  }
}

class _ItemsTab extends ConsumerWidget {
  final TextEditingController searchController;

  const _ItemsTab({required this.searchController});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final itemsState = ref.watch(itemsProvider);
    final currencyFormat = NumberFormat.currency(symbol: 'RM ', decimalDigits: 2);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: searchController,
            decoration: InputDecoration(
              hintText: 'Search items...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        searchController.clear();
                        ref.read(itemsProvider.notifier).loadItems();
                      },
                    )
                  : null,
            ),
            onSubmitted: (value) {
              ref.read(itemsProvider.notifier).loadItems(search: value);
            },
          ),
        ),
        Expanded(
          child: itemsState.isLoading && itemsState.items.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: () async {
                    ref.read(itemsProvider.notifier).refresh();
                  },
                  child: ListView.builder(
                    itemCount: itemsState.items.length,
                    itemBuilder: (context, index) {
                      final item = itemsState.items[index];
                      return _ItemListTile(
                        item: item,
                        currencyFormat: currencyFormat,
                        onTap: () => _showItemDetails(context, item),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }

  void _showItemDetails(BuildContext context, Item item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
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
                          item.code,
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        Text(
                          item.name,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ],
                    ),
                  ),
                  _StockBadge(quantity: item.stockQuantity, isLowStock: item.isLowStock),
                ],
              ),
              const SizedBox(height: 24),
              _DetailRow('Category', item.categoryName ?? '-'),
              _DetailRow('Barcode', item.barcode ?? '-'),
              _DetailRow('Unit', item.uom),
              _DetailRow(
                'Cost Price',
                NumberFormat.currency(symbol: 'RM ').format(item.costPrice),
              ),
              _DetailRow(
                'Selling Price',
                NumberFormat.currency(symbol: 'RM ').format(item.sellingPrice),
              ),
              _DetailRow('Reorder Point', item.reorderPoint.toString()),
              _DetailRow('Reorder Qty', item.reorderQuantity.toString()),
              if (item.description != null) ...[
                const SizedBox(height: 16),
                const Text(
                  'Description',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(item.description!),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StockLevelsTab extends ConsumerWidget {
  const _StockLevelsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stockLevels = ref.watch(stockLevelsProvider);
    final selectedWarehouse = ref.watch(selectedWarehouseProvider);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  selectedWarehouse?.name ?? 'All Warehouses',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
              TextButton.icon(
                icon: const Icon(Icons.filter_list),
                label: const Text('Filter'),
                onPressed: () {
                  // Show filter options
                },
              ),
            ],
          ),
        ),
        Expanded(
          child: stockLevels.when(
            data: (levels) => RefreshIndicator(
              onRefresh: () async {
                ref.read(stockLevelsProvider.notifier).loadStockLevels(
                      warehouseId: selectedWarehouse?.id,
                    );
              },
              child: ListView.builder(
                itemCount: levels.length,
                itemBuilder: (context, index) {
                  final level = levels[index];
                  return ListTile(
                    title: Text(level.itemName),
                    subtitle: Text(
                      '${level.itemCode} • ${level.warehouseName}',
                      style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          level.availableQuantity.toString(),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: level.availableQuantity <= 0
                                ? AppTheme.errorColor
                                : null,
                          ),
                        ),
                        if (level.reservedQuantity > 0)
                          Text(
                            '${level.reservedQuantity} reserved',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => const Center(child: Text('Failed to load stock levels')),
          ),
        ),
      ],
    );
  }
}

class _ItemListTile extends StatelessWidget {
  final Item item;
  final NumberFormat currencyFormat;
  final VoidCallback onTap;

  const _ItemListTile({
    required this.item,
    required this.currencyFormat,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      title: Text(item.name),
      subtitle: Text(
        item.code,
        style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          _StockBadge(quantity: item.stockQuantity, isLowStock: item.isLowStock),
          const SizedBox(height: 4),
          Text(
            currencyFormat.format(item.sellingPrice),
            style: const TextStyle(fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _StockBadge extends StatelessWidget {
  final int quantity;
  final bool isLowStock;

  const _StockBadge({required this.quantity, required this.isLowStock});

  @override
  Widget build(BuildContext context) {
    Color color;
    if (quantity <= 0) {
      color = AppTheme.errorColor;
    } else if (isLowStock) {
      color = AppTheme.warningColor;
    } else {
      color = AppTheme.successColor;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        quantity.toString(),
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: color,
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
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: AppTheme.textSecondary),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
