import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/pick_list.dart';
import '../models/sales_order.dart';
import '../providers/pick_list_provider.dart';
import '../providers/warehouse_provider.dart';
import '../core/theme.dart';

class PickListScreen extends ConsumerStatefulWidget {
  const PickListScreen({super.key});

  @override
  ConsumerState<PickListScreen> createState() => _PickListScreenState();
}

class _PickListScreenState extends ConsumerState<PickListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final warehouseId = ref.read(selectedWarehouseProvider)?.id;
      ref.read(pickListProvider.notifier).loadOrdersReadyForPicking(warehouseId: warehouseId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(pickListProvider);
    final orders = ref.watch(ordersReadyForPickingProvider);
    final selectedWarehouse = ref.watch(selectedWarehouseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pick Lists'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(pickListProvider.notifier).loadOrdersReadyForPicking(
                  warehouseId: selectedWarehouse?.id,
                ),
          ),
        ],
      ),
      body: state.isLoading && orders.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : orders.isEmpty
              ? _buildEmptyState()
              : _buildOrdersList(orders),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.inventory_2_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No Orders Ready for Picking',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Confirmed orders will appear here',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildOrdersList(List<SalesOrder> orders) {
    return RefreshIndicator(
      onRefresh: () async {
        final warehouseId = ref.read(selectedWarehouseProvider)?.id;
        await ref.read(pickListProvider.notifier).loadOrdersReadyForPicking(warehouseId: warehouseId);
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          final order = orders[index];
          return _buildOrderCard(order);
        },
      ),
    );
  }

  Widget _buildOrderCard(SalesOrder order) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _showOrderOptions(order),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      order.orderNumber,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _buildStatusChip(order.status),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                order.customerName,
                style: TextStyle(color: Colors.grey[700]),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.warehouse_outlined, size: 16, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    order.warehouseName,
                    style: TextStyle(color: Colors.grey[500], fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildInfoChip(
                    icon: Icons.inventory_2_outlined,
                    label: '${order.totalItems} items',
                  ),
                  const SizedBox(width: 8),
                  _buildInfoChip(
                    icon: Icons.numbers,
                    label: '${order.totalQuantity} qty',
                  ),
                  const Spacer(),
                  Icon(
                    Icons.chevron_right,
                    color: Colors.grey[400],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(SalesOrderStatus status) {
    Color color;
    switch (status) {
      case SalesOrderStatus.confirmed:
        color = Colors.blue;
        break;
      case SalesOrderStatus.processing:
        color = Colors.orange;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.displayName,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildInfoChip({required IconData icon, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.grey[600]),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  void _showOrderOptions(SalesOrder order) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.playlist_add_check),
              title: const Text('Create Pick List'),
              subtitle: const Text('Start picking items for this order'),
              onTap: () {
                Navigator.pop(context);
                _createPickList(order);
              },
            ),
            ListTile(
              leading: const Icon(Icons.info_outline),
              title: const Text('View Order Details'),
              onTap: () {
                Navigator.pop(context);
                _showOrderDetails(order);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _createPickList(SalesOrder order) async {
    final pickList = await ref.read(pickListProvider.notifier).createPickList(order.id);

    if (pickList != null && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => PickListProcessScreen(pickList: pickList),
        ),
      ).then((_) {
        ref.read(pickListProvider.notifier).refresh();
      });
    }
  }

  void _showOrderDetails(SalesOrder order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.orderNumber,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          order.customerName,
                          style: const TextStyle(color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: order.items.length,
                itemBuilder: (context, index) {
                  final item = order.items[index];
                  return ListTile(
                    title: Text(item.itemName),
                    subtitle: Text(item.itemCode),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'Qty: ${item.quantity}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        if (item.binLocation != null)
                          Text(
                            'Bin: ${item.binLocation}',
                            style: TextStyle(color: Colors.grey[600], fontSize: 12),
                          ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class PickListProcessScreen extends ConsumerStatefulWidget {
  final PickList pickList;

  const PickListProcessScreen({super.key, required this.pickList});

  @override
  ConsumerState<PickListProcessScreen> createState() => _PickListProcessScreenState();
}

class _PickListProcessScreenState extends ConsumerState<PickListProcessScreen> {
  late List<TextEditingController> _controllers;

  @override
  void initState() {
    super.initState();
    _controllers = widget.pickList.lines
        .map((line) => TextEditingController(text: '0'))
        .toList();
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentPickList = ref.watch(currentPickListProvider) ?? widget.pickList;
    final state = ref.watch(pickListProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Pick List ${widget.pickList.pickListNumber}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: _openScanner,
            tooltip: 'Scan Item',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildProgressHeader(currentPickList),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: currentPickList.lines.length,
              itemBuilder: (context, index) {
                final line = currentPickList.lines[index];
                return _buildLineCard(line, index);
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton(
            onPressed: state.isLoading ? null : _processPickList,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
            ),
            child: state.isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Complete Pick List',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildProgressHeader(PickList pickList) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.grey[50],
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Order: ${pickList.salesOrderNumber ?? pickList.salesOrderId}',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
              Text(
                '${pickList.totalQuantityPicked}/${pickList.totalQuantityToPick} picked',
                style: TextStyle(
                  color: pickList.isComplete ? Colors.green : Colors.orange,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: pickList.progressPercent / 100,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(
              pickList.isComplete ? Colors.green : AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLineCard(PickListLine line, int index) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
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
                        line.itemName ?? 'Unknown Item',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        line.itemCode ?? line.itemId,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ),
                if (line.isComplete)
                  const Icon(Icons.check_circle, color: Colors.green)
                else
                  Icon(Icons.circle_outlined, color: Colors.grey[400]),
              ],
            ),
            if (line.binLocationCode != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.location_on, size: 14, color: Colors.blue[700]),
                    const SizedBox(width: 4),
                    Text(
                      'Bin: ${line.binLocationCode}',
                      style: TextStyle(color: Colors.blue[700], fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Text(
                  'To Pick: ${line.quantityToPick}',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                const Spacer(),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline),
                      onPressed: () => _decrementQuantity(line, index),
                      color: Colors.red[400],
                    ),
                    SizedBox(
                      width: 60,
                      child: TextField(
                        controller: _controllers[index],
                        textAlign: TextAlign.center,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (value) {
                          final qty = int.tryParse(value) ?? 0;
                          ref.read(pickListProvider.notifier).updateLineQuantity(line.id, qty);
                        },
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline),
                      onPressed: () => _incrementQuantity(line, index),
                      color: Colors.green[400],
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickAll(line, index),
                    icon: const Icon(Icons.done_all, size: 18),
                    label: const Text('Pick All'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _incrementQuantity(PickListLine line, int index) {
    final currentQty = int.tryParse(_controllers[index].text) ?? 0;
    if (currentQty < line.quantityToPick) {
      final newQty = currentQty + 1;
      _controllers[index].text = newQty.toString();
      ref.read(pickListProvider.notifier).updateLineQuantity(line.id, newQty);
    }
  }

  void _decrementQuantity(PickListLine line, int index) {
    final currentQty = int.tryParse(_controllers[index].text) ?? 0;
    if (currentQty > 0) {
      final newQty = currentQty - 1;
      _controllers[index].text = newQty.toString();
      ref.read(pickListProvider.notifier).updateLineQuantity(line.id, newQty);
    }
  }

  void _pickAll(PickListLine line, int index) {
    _controllers[index].text = line.quantityToPick.toString();
    ref.read(pickListProvider.notifier).updateLineQuantity(line.id, line.quantityToPick);
  }

  void _openScanner() {
    // Navigate to scan screen and process barcode
    Navigator.pushNamed(context, '/scan').then((result) {
      if (result != null && result is String) {
        _handleScannedBarcode(result);
      }
    });
  }

  void _handleScannedBarcode(String barcode) {
    final currentPickList = ref.read(currentPickListProvider);
    if (currentPickList == null) return;

    // Find the line matching the scanned barcode
    final index = currentPickList.lines.indexWhere(
      (line) => line.itemCode == barcode || line.itemId == barcode,
    );

    if (index >= 0) {
      _incrementQuantity(currentPickList.lines[index], index);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Picked: ${currentPickList.lines[index].itemName}'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 1),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Item not in pick list: $barcode'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  void _processPickList() async {
    final success = await ref.read(pickListProvider.notifier).processPickList();

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pick list completed successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to complete pick list'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
