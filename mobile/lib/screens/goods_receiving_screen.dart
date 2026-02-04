import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/purchase_order.dart';
import '../providers/goods_receiving_provider.dart';
import '../core/theme.dart';

class GoodsReceivingScreen extends ConsumerStatefulWidget {
  const GoodsReceivingScreen({super.key});

  @override
  ConsumerState<GoodsReceivingScreen> createState() => _GoodsReceivingScreenState();
}

class _GoodsReceivingScreenState extends ConsumerState<GoodsReceivingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(goodsReceivingProvider.notifier).loadOrdersToReceive();
      ref.read(goodsReceivingProvider.notifier).loadRecentGRNs();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(goodsReceivingProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Goods Receiving'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Orders to Receive'),
            Tab(text: 'Recent GRNs'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(goodsReceivingProvider.notifier).refresh(),
          ),
        ],
      ),
      body: state.isLoading && state.ordersToReceive.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOrdersList(state.ordersToReceive),
                _buildGRNsList(state),
              ],
            ),
    );
  }

  Widget _buildOrdersList(List<PurchaseOrder> orders) {
    if (orders.isEmpty) {
      return _buildEmptyState(
        icon: Icons.inventory_2_outlined,
        title: 'No Orders to Receive',
        subtitle: 'Issued purchase orders will appear here',
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(goodsReceivingProvider.notifier).loadOrdersToReceive();
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

  Widget _buildGRNsList(GoodsReceivingState state) {
    if (state.recentGRNs.isEmpty) {
      return _buildEmptyState(
        icon: Icons.receipt_long_outlined,
        title: 'No Recent GRNs',
        subtitle: 'Your goods received notes will appear here',
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(goodsReceivingProvider.notifier).loadRecentGRNs();
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: state.recentGRNs.length,
        itemBuilder: (context, index) {
          final grn = state.recentGRNs[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(
                grn.grnNumber,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (grn.poNumber != null) Text('PO: ${grn.poNumber}'),
                  if (grn.vendorName != null) Text(grn.vendorName!),
                  Text(
                    '${grn.totalItems} items received',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  ),
                ],
              ),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  grn.status.displayName,
                  style: const TextStyle(
                    color: Colors.green,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              isThreeLine: true,
            ),
          );
        },
      ),
    );
  }

  Widget _buildOrderCard(PurchaseOrder order) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _startReceiving(order),
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
                      order.poNumber,
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
                order.vendorName,
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
                  const Icon(Icons.chevron_right, color: Colors.grey),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(PurchaseOrderStatus status) {
    Color color;
    switch (status) {
      case PurchaseOrderStatus.issued:
        color = Colors.blue;
        break;
      case PurchaseOrderStatus.partiallyReceived:
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

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(subtitle, style: TextStyle(color: Colors.grey[500])),
        ],
      ),
    );
  }

  void _startReceiving(PurchaseOrder order) async {
    final loadedOrder = await ref.read(goodsReceivingProvider.notifier).selectOrder(order.id);

    if (loadedOrder != null && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => GoodsReceivingProcessScreen(order: loadedOrder),
        ),
      ).then((_) {
        ref.read(goodsReceivingProvider.notifier).refresh();
      });
    }
  }
}

class GoodsReceivingProcessScreen extends ConsumerStatefulWidget {
  final PurchaseOrder order;

  const GoodsReceivingProcessScreen({super.key, required this.order});

  @override
  ConsumerState<GoodsReceivingProcessScreen> createState() =>
      _GoodsReceivingProcessScreenState();
}

class _GoodsReceivingProcessScreenState
    extends ConsumerState<GoodsReceivingProcessScreen> {
  late List<TextEditingController> _controllers;
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _controllers = widget.order.items
        .map((line) => TextEditingController(text: '0'))
        .toList();
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(goodsReceivingProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Receive ${widget.order.poNumber}'),
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
          _buildHeader(),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: widget.order.items.length,
              itemBuilder: (context, index) {
                final line = widget.order.items[index];
                return _buildLineCard(line, index);
              },
            ),
          ),
          _buildNotesField(),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton(
            onPressed: state.isLoading ? null : _createGRN,
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
                    'Create GRN',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.grey[50],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.order.vendorName,
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
              Text(
                '${widget.order.totalItems} items',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Warehouse: ${widget.order.warehouseName}',
            style: TextStyle(color: Colors.grey[600], fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildLineCard(PurchaseOrderItem line, int index) {
    final remaining = line.quantity - line.quantityReceived;

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
                        line.itemName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        line.itemCode,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ordered: ${line.quantity}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 13),
                      ),
                      Text(
                        'Already Received: ${line.quantityReceived}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 13),
                      ),
                      Text(
                        'Remaining: $remaining',
                        style: TextStyle(
                          color: remaining > 0 ? Colors.orange : Colors.green,
                          fontWeight: FontWeight.w500,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  children: [
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
                              contentPadding:
                                  EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                              border: OutlineInputBorder(),
                            ),
                            onChanged: (value) {
                              final qty = int.tryParse(value) ?? 0;
                              ref
                                  .read(goodsReceivingProvider.notifier)
                                  .updateReceivedQuantity(line.id, qty);
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
                    TextButton(
                      onPressed: () => _receiveAll(line, index),
                      child: const Text('Receive All'),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotesField() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: TextField(
        controller: _notesController,
        decoration: const InputDecoration(
          hintText: 'Add notes (optional)',
          border: InputBorder.none,
          prefixIcon: Icon(Icons.note_outlined),
        ),
      ),
    );
  }

  void _incrementQuantity(PurchaseOrderItem line, int index) {
    final currentQty = int.tryParse(_controllers[index].text) ?? 0;
    final maxQty = line.quantity - line.quantityReceived;
    if (currentQty < maxQty) {
      final newQty = currentQty + 1;
      _controllers[index].text = newQty.toString();
      ref.read(goodsReceivingProvider.notifier).updateReceivedQuantity(line.id, newQty);
    }
  }

  void _decrementQuantity(PurchaseOrderItem line, int index) {
    final currentQty = int.tryParse(_controllers[index].text) ?? 0;
    if (currentQty > 0) {
      final newQty = currentQty - 1;
      _controllers[index].text = newQty.toString();
      ref.read(goodsReceivingProvider.notifier).updateReceivedQuantity(line.id, newQty);
    }
  }

  void _receiveAll(PurchaseOrderItem line, int index) {
    final remaining = line.quantity - line.quantityReceived;
    _controllers[index].text = remaining.toString();
    ref.read(goodsReceivingProvider.notifier).updateReceivedQuantity(line.id, remaining);
  }

  void _openScanner() {
    Navigator.pushNamed(context, '/scan').then((result) {
      if (result != null && result is String) {
        _handleScannedBarcode(result);
      }
    });
  }

  void _handleScannedBarcode(String barcode) {
    final index = widget.order.items.indexWhere(
      (line) => line.itemCode == barcode || line.itemId == barcode,
    );

    if (index >= 0) {
      _incrementQuantity(widget.order.items[index], index);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Received: ${widget.order.items[index].itemName}'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 1),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Item not in order: $barcode'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  void _createGRN() async {
    final grn = await ref.read(goodsReceivingProvider.notifier).createGRN(
          notes: _notesController.text.isNotEmpty ? _notesController.text : null,
        );

    if (grn != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('GRN ${grn.grnNumber} created successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    } else if (mounted) {
      final error = ref.read(goodsReceivingProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? 'Failed to create GRN'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
