import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/inventory_provider.dart';
import '../providers/warehouse_provider.dart';
import '../core/theme.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(dashboardStatsProvider);
    final selectedWarehouse = ref.watch(selectedWarehouseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(dashboardStatsProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardStatsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Warehouse Selector
              if (selectedWarehouse != null)
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.warehouse, color: AppTheme.primaryColor),
                    title: Text(selectedWarehouse.name),
                    subtitle: Text(selectedWarehouse.code),
                    trailing: const Icon(Icons.arrow_drop_down),
                    onTap: () => _showWarehouseSelector(context, ref),
                  ),
                ),
              const SizedBox(height: 16),

              // Stats Grid
              stats.when(
                data: (data) => GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.5,
                  children: [
                    _StatCard(
                      title: 'Total Items',
                      value: data.totalItems.toString(),
                      icon: Icons.inventory_2,
                      color: AppTheme.primaryColor,
                    ),
                    _StatCard(
                      title: 'Low Stock',
                      value: data.lowStockItems.toString(),
                      icon: Icons.warning_amber,
                      color: AppTheme.warningColor,
                    ),
                    _StatCard(
                      title: 'Sales Orders',
                      value: data.pendingSalesOrders.toString(),
                      icon: Icons.shopping_cart,
                      color: AppTheme.successColor,
                    ),
                    _StatCard(
                      title: 'Purchase Orders',
                      value: data.pendingPurchaseOrders.toString(),
                      icon: Icons.local_shipping,
                      color: Colors.purple,
                    ),
                  ],
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const Center(child: Text('Failed to load stats')),
              ),
              const SizedBox(height: 24),

              // Quick Actions
              Text(
                'Quick Actions',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 2,
                children: [
                  _QuickActionCard(
                    title: 'Scan Item',
                    icon: Icons.qr_code_scanner,
                    color: AppTheme.primaryColor,
                    onTap: () {
                      // Navigate to scan
                    },
                  ),
                  _QuickActionCard(
                    title: 'Pick Order',
                    icon: Icons.checklist,
                    color: AppTheme.successColor,
                    onTap: () {
                      // Navigate to picking
                    },
                  ),
                  _QuickActionCard(
                    title: 'Receive Goods',
                    icon: Icons.move_to_inbox,
                    color: Colors.purple,
                    onTap: () {
                      // Navigate to receiving
                    },
                  ),
                  _QuickActionCard(
                    title: 'Stock Adjust',
                    icon: Icons.tune,
                    color: AppTheme.warningColor,
                    onTap: () {
                      // Navigate to adjustment
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showWarehouseSelector(BuildContext context, WidgetRef ref) {
    final warehouses = ref.read(warehousesProvider);

    showModalBottomSheet(
      context: context,
      builder: (context) => warehouses.when(
        data: (list) => ListView.builder(
          shrinkWrap: true,
          itemCount: list.length,
          itemBuilder: (context, index) {
            final warehouse = list[index];
            return ListTile(
              leading: Icon(
                Icons.warehouse,
                color: warehouse.isPrimary ? AppTheme.primaryColor : null,
              ),
              title: Text(warehouse.name),
              subtitle: Text(warehouse.code),
              trailing: warehouse.isPrimary
                  ? const Chip(label: Text('Primary'))
                  : null,
              onTap: () {
                ref.read(selectedWarehouseProvider.notifier).state = warehouse;
                Navigator.pop(context);
              },
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Failed to load warehouses')),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const Spacer(),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
