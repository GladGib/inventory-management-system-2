import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/sales_provider.dart';
import '../providers/purchases_provider.dart';
import '../models/sales_order.dart';
import '../models/purchase_order.dart';
import '../core/theme.dart';
import 'package:intl/intl.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Orders'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Picking'),
            Tab(text: 'Receiving'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _PickingTab(),
          _ReceivingTab(),
        ],
      ),
    );
  }
}

class _PickingTab extends ConsumerWidget {
  const _PickingTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final salesState = ref.watch(salesOrdersProvider);
    final pickingOrders = ref.watch(pickingOrdersProvider);
    final dateFormat = DateFormat('dd/MM/yyyy');
    final currencyFormat = NumberFormat.currency(symbol: 'RM ', decimalDigits: 2);

    if (salesState.isLoading && pickingOrders.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (pickingOrders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.checklist, size: 64, color: AppTheme.textSecondary),
            const SizedBox(height: 16),
            const Text(
              'No orders to pick',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => ref.read(salesOrdersProvider.notifier).refresh(),
              icon: const Icon(Icons.refresh),
              label: const Text('Refresh'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.read(salesOrdersProvider.notifier).refresh();
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: pickingOrders.length,
        itemBuilder: (context, index) {
          final order = pickingOrders[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: () => _showPickingDetails(context, ref, order),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          order.orderNumber,
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        _StatusChip(status: order.status.displayName),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      order.customerName,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${order.totalItems} items • ${currencyFormat.format(order.totalAmount)}',
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.calendar_today,
                            size: 14, color: AppTheme.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          dateFormat.format(order.orderDate),
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                        const Spacer(),
                        if (!order.isFullyPicked)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '${order.totalPicked}/${order.totalQuantity} picked',
                              style: const TextStyle(
                                color: AppTheme.primaryColor,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showPickingDetails(BuildContext context, WidgetRef ref, SalesOrder order) {
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
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppTheme.borderColor)),
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
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                        Text(
                          order.customerName,
                          style: const TextStyle(color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      // Start picking process
                      Navigator.pop(context);
                    },
                    child: const Text('Start Picking'),
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
                    subtitle: Text(
                      item.itemCode,
                      style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                    ),
                    trailing: Text(
                      '${item.pickedQuantity}/${item.quantity}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: item.isFullyPicked
                            ? AppTheme.successColor
                            : AppTheme.textColor,
                      ),
                    ),
                    leading: Icon(
                      item.isFullyPicked
                          ? Icons.check_circle
                          : Icons.radio_button_unchecked,
                      color: item.isFullyPicked
                          ? AppTheme.successColor
                          : AppTheme.textSecondary,
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

class _ReceivingTab extends ConsumerWidget {
  const _ReceivingTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final purchasesState = ref.watch(purchaseOrdersProvider);
    final receivingOrders = ref.watch(receivingOrdersProvider);
    final dateFormat = DateFormat('dd/MM/yyyy');
    final currencyFormat = NumberFormat.currency(symbol: 'RM ', decimalDigits: 2);

    if (purchasesState.isLoading && receivingOrders.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (receivingOrders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.move_to_inbox, size: 64, color: AppTheme.textSecondary),
            const SizedBox(height: 16),
            const Text(
              'No orders to receive',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => ref.read(purchaseOrdersProvider.notifier).refresh(),
              icon: const Icon(Icons.refresh),
              label: const Text('Refresh'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.read(purchaseOrdersProvider.notifier).refresh();
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: receivingOrders.length,
        itemBuilder: (context, index) {
          final order = receivingOrders[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: () => _showReceivingDetails(context, ref, order),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          order.orderNumber,
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        _StatusChip(status: order.status.displayName),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      order.vendorName,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${order.totalItems} items • ${currencyFormat.format(order.totalAmount)}',
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.calendar_today,
                            size: 14, color: AppTheme.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          dateFormat.format(order.orderDate),
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                        const Spacer(),
                        if (!order.isFullyReceived)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.purple.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '${order.totalReceived}/${order.totalQuantity} received',
                              style: const TextStyle(
                                color: Colors.purple,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showReceivingDetails(BuildContext context, WidgetRef ref, PurchaseOrder order) {
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
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppTheme.borderColor)),
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
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                        Text(
                          order.vendorName,
                          style: const TextStyle(color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      // Start receiving process
                      Navigator.pop(context);
                    },
                    child: const Text('Receive Goods'),
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
                    subtitle: Text(
                      item.itemCode,
                      style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                    ),
                    trailing: Text(
                      '${item.receivedQuantity}/${item.quantity}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: item.isFullyReceived
                            ? AppTheme.successColor
                            : AppTheme.textColor,
                      ),
                    ),
                    leading: Icon(
                      item.isFullyReceived
                          ? Icons.check_circle
                          : Icons.radio_button_unchecked,
                      color: item.isFullyReceived
                          ? AppTheme.successColor
                          : AppTheme.textSecondary,
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

class _StatusChip extends StatelessWidget {
  final String status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status,
        style: const TextStyle(
          color: AppTheme.primaryColor,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
