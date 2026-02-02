import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/inventory_provider.dart';
import '../providers/warehouse_provider.dart';
import '../providers/items_provider.dart';
import '../models/stock_adjustment.dart';
import '../models/item.dart';
import '../core/theme.dart';

class StockAdjustmentScreen extends ConsumerStatefulWidget {
  final Item? preselectedItem;

  const StockAdjustmentScreen({super.key, this.preselectedItem});

  @override
  ConsumerState<StockAdjustmentScreen> createState() => _StockAdjustmentScreenState();
}

class _StockAdjustmentScreenState extends ConsumerState<StockAdjustmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  final _notesController = TextEditingController();

  AdjustmentType _selectedType = AdjustmentType.add;
  String? _selectedWarehouseId;
  final List<StockAdjustmentItem> _items = [];
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.preselectedItem != null) {
      _items.add(StockAdjustmentItem(
        itemId: widget.preselectedItem!.id,
        itemCode: widget.preselectedItem!.code,
        itemName: widget.preselectedItem!.name,
        quantity: 1,
      ));
    }
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedWarehouseId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a warehouse')),
      );
      return;
    }
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one item')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final request = CreateStockAdjustmentRequest(
      warehouseId: _selectedWarehouseId!,
      type: _selectedType,
      reason: _reasonController.text.trim(),
      notes: _notesController.text.trim().isNotEmpty
          ? _notesController.text.trim()
          : null,
      items: _items,
    );

    final success = await ref.read(inventoryProvider.notifier).createStockAdjustment(request);

    setState(() => _isSubmitting = false);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Stock adjustment created successfully'),
          backgroundColor: AppTheme.successColor,
        ),
      );
      Navigator.pop(context);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to create stock adjustment'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  void _showAddItemDialog() {
    final itemsState = ref.read(itemsProvider);
    Item? selectedItem;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) => Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  decoration: const InputDecoration(
                    hintText: 'Search items...',
                    prefixIcon: Icon(Icons.search),
                  ),
                  onChanged: (value) {
                    ref.read(itemsProvider.notifier).loadItems(search: value);
                  },
                ),
              ),
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  itemCount: itemsState.items.length,
                  itemBuilder: (context, index) {
                    final item = itemsState.items[index];
                    final isAlreadyAdded = _items.any((i) => i.itemId == item.id);

                    return ListTile(
                      enabled: !isAlreadyAdded,
                      title: Text(item.name),
                      subtitle: Text(item.code),
                      trailing: isAlreadyAdded
                          ? const Chip(label: Text('Added'))
                          : null,
                      onTap: isAlreadyAdded
                          ? null
                          : () {
                              setState(() {
                                _items.add(StockAdjustmentItem(
                                  itemId: item.id,
                                  itemCode: item.code,
                                  itemName: item.name,
                                  quantity: 1,
                                ));
                              });
                              Navigator.pop(context);
                            },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final warehouses = ref.watch(warehousesProvider);
    final selectedWarehouse = ref.watch(selectedWarehouseProvider);

    // Set default warehouse if not set
    if (_selectedWarehouseId == null && selectedWarehouse != null) {
      _selectedWarehouseId = selectedWarehouse.id;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock Adjustment'),
        actions: [
          TextButton(
            onPressed: _isSubmitting ? null : _submit,
            child: _isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Warehouse Selection
            warehouses.when(
              data: (list) => DropdownButtonFormField<String>(
                value: _selectedWarehouseId,
                decoration: const InputDecoration(
                  labelText: 'Warehouse',
                  prefixIcon: Icon(Icons.warehouse),
                ),
                items: list
                    .map((w) => DropdownMenuItem(
                          value: w.id,
                          child: Text(w.name),
                        ))
                    .toList(),
                onChanged: (value) {
                  setState(() => _selectedWarehouseId = value);
                },
                validator: (value) {
                  if (value == null) return 'Please select a warehouse';
                  return null;
                },
              ),
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const Text('Failed to load warehouses'),
            ),
            const SizedBox(height: 16),

            // Adjustment Type
            DropdownButtonFormField<AdjustmentType>(
              value: _selectedType,
              decoration: const InputDecoration(
                labelText: 'Adjustment Type',
                prefixIcon: Icon(Icons.tune),
              ),
              items: AdjustmentType.values
                  .map((t) => DropdownMenuItem(
                        value: t,
                        child: Text(t.displayName),
                      ))
                  .toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _selectedType = value);
                }
              },
            ),
            const SizedBox(height: 16),

            // Reason
            TextFormField(
              controller: _reasonController,
              decoration: const InputDecoration(
                labelText: 'Reason',
                prefixIcon: Icon(Icons.comment),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a reason';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Notes
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'Notes (optional)',
                prefixIcon: Icon(Icons.notes),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 24),

            // Items Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Items',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                TextButton.icon(
                  onPressed: _showAddItemDialog,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Item'),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (_items.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      Icon(Icons.inventory_2,
                          size: 48, color: AppTheme.textSecondary),
                      const SizedBox(height: 8),
                      const Text(
                        'No items added',
                        style: TextStyle(color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...List.generate(_items.length, (index) {
                final item = _items[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.itemCode,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 12,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                              Text(item.itemName),
                            ],
                          ),
                        ),
                        SizedBox(
                          width: 80,
                          child: TextFormField(
                            initialValue: item.quantity.toString(),
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                            decoration: const InputDecoration(
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 8,
                              ),
                            ),
                            onChanged: (value) {
                              final qty = int.tryParse(value) ?? 1;
                              setState(() {
                                _items[index].quantity = qty > 0 ? qty : 1;
                              });
                            },
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: AppTheme.errorColor),
                          onPressed: () {
                            setState(() {
                              _items.removeAt(index);
                            });
                          },
                        ),
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
}
