import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/warehouse_provider.dart';
import '../models/warehouse.dart';
import '../core/theme.dart';
import 'main_screen.dart';

class WarehouseSelectionScreen extends ConsumerStatefulWidget {
  /// When true, navigates to MainScreen after selection.
  /// When false, just pops back with the selected warehouse.
  final bool isInitialSelection;

  const WarehouseSelectionScreen({
    super.key,
    this.isInitialSelection = false,
  });

  @override
  ConsumerState<WarehouseSelectionScreen> createState() =>
      _WarehouseSelectionScreenState();
}

class _WarehouseSelectionScreenState
    extends ConsumerState<WarehouseSelectionScreen> {
  static const String _warehouseIdKey = 'selected_warehouse_id';

  @override
  void initState() {
    super.initState();
    // Ensure warehouses are loaded
    Future.microtask(() {
      ref.read(warehousesProvider.notifier).loadWarehouses();
    });
  }

  Future<void> _selectWarehouse(Warehouse warehouse) async {
    // Save selection to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_warehouseIdKey, warehouse.id);

    // Update the selected warehouse provider
    ref.read(selectedWarehouseProvider.notifier).state = warehouse;

    if (!mounted) return;

    if (widget.isInitialSelection) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const MainScreen()),
      );
    } else {
      Navigator.pop(context, warehouse);
    }
  }

  @override
  Widget build(BuildContext context) {
    final warehousesState = ref.watch(warehousesProvider);
    final selectedWarehouse = ref.watch(selectedWarehouseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Warehouse'),
        automaticallyImplyLeading: !widget.isInitialSelection,
      ),
      body: warehousesState.when(
        data: (warehouses) {
          if (warehouses.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.warehouse_outlined,
                    size: 64,
                    color: AppColors.textTertiary,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No warehouses found',
                    style: AppTypography.h4,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Please contact your administrator to set up warehouses.',
                    style: AppTypography.small,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.read(warehousesProvider.notifier).loadWarehouses();
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(AppSpacing.md),
              itemCount: warehouses.length,
              itemBuilder: (context, index) {
                final warehouse = warehouses[index];
                final isSelected = selectedWarehouse?.id == warehouse.id;

                return _WarehouseCard(
                  warehouse: warehouse,
                  isSelected: isSelected,
                  onTap: () => _selectWarehouse(warehouse),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 48,
                color: AppColors.error,
              ),
              const SizedBox(height: 16),
              const Text(
                'Failed to load warehouses',
                style: AppTypography.h4,
              ),
              const SizedBox(height: 8),
              Text(
                error.toString(),
                style: AppTypography.small,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () {
                  ref.read(warehousesProvider.notifier).loadWarehouses();
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WarehouseCard extends StatelessWidget {
  final Warehouse warehouse;
  final bool isSelected;
  final VoidCallback onTap;

  const _WarehouseCard({
    required this.warehouse,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.borderLg,
        side: BorderSide(
          color: isSelected ? AppColors.primary : AppColors.borderLight,
          width: isSelected ? 2 : 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.borderLg,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.primary.withOpacity(0.1)
                      : AppColors.background,
                  borderRadius: AppRadius.borderLg,
                ),
                child: Icon(
                  Icons.warehouse,
                  color: isSelected ? AppColors.primary : AppColors.textTertiary,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            warehouse.name,
                            style: AppTypography.bodyMedium,
                          ),
                        ),
                        if (warehouse.isPrimary)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryBg,
                              borderRadius: AppRadius.borderFull,
                            ),
                            child: const Text(
                              'Primary',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      warehouse.code,
                      style: AppTypography.caption.copyWith(
                        fontFamily: 'RobotoMono',
                      ),
                    ),
                    if (warehouse.address != null &&
                        warehouse.address!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        warehouse.address!,
                        style: AppTypography.small,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              if (isSelected)
                const Icon(Icons.check_circle, color: AppColors.primary)
              else
                const Icon(Icons.chevron_right, color: AppColors.textTertiary),
            ],
          ),
        ),
      ),
    );
  }
}
