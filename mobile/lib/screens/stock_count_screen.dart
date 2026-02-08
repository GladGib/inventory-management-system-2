import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/stock_count.dart';
import '../models/warehouse.dart';
import '../providers/stock_count_provider.dart';
import '../providers/warehouse_provider.dart';
import '../core/theme.dart';

class StockCountScreen extends ConsumerStatefulWidget {
  const StockCountScreen({super.key});

  @override
  ConsumerState<StockCountScreen> createState() => _StockCountScreenState();
}

class _StockCountScreenState extends ConsumerState<StockCountScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final warehouseId = ref.read(selectedWarehouseProvider)?.id;
      ref.read(stockCountProvider.notifier).loadStockCounts(warehouseId: warehouseId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(stockCountProvider);
    final selectedWarehouse = ref.watch(selectedWarehouseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock Counts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(stockCountProvider.notifier).loadStockCounts(
                  warehouseId: selectedWarehouse?.id,
                ),
          ),
        ],
      ),
      body: state.isLoading && state.stockCounts.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.stockCounts.isEmpty
              ? _buildEmptyState()
              : _buildCountsList(state.stockCounts),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateDialog,
        icon: const Icon(Icons.add),
        label: const Text('New Count'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.assignment_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No Stock Counts',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Create a new stock count to get started',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildCountsList(List<StockCount> counts) {
    final inProgress = counts.where((c) => c.status == StockCountStatus.inProgress).toList();
    final completed = counts.where((c) => c.status == StockCountStatus.completed).toList();

    return RefreshIndicator(
      onRefresh: () async {
        final warehouseId = ref.read(selectedWarehouseProvider)?.id;
        await ref.read(stockCountProvider.notifier).loadStockCounts(warehouseId: warehouseId);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (inProgress.isNotEmpty) ...[
            Text(
              'In Progress',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            ...inProgress.map((count) => _buildCountCard(count)),
            const SizedBox(height: 24),
          ],
          if (completed.isNotEmpty) ...[
            Text(
              'Completed',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            ...completed.map((count) => _buildCountCard(count)),
          ],
        ],
      ),
    );
  }

  Widget _buildCountCard(StockCount count) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _openCount(count),
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
                      count.countNumber,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _buildStatusChip(count.status),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.warehouse_outlined, size: 16, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    count.warehouseName ?? 'Unknown Warehouse',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (count.status == StockCountStatus.inProgress) ...[
                LinearProgressIndicator(
                  value: count.progressPercent / 100,
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                ),
                const SizedBox(height: 8),
              ],
              Row(
                children: [
                  _buildInfoChip(
                    icon: Icons.inventory_2_outlined,
                    label: '${count.countedItems}/${count.totalItems} counted',
                  ),
                  if (count.varianceItems > 0) ...[
                    const SizedBox(width: 8),
                    _buildInfoChip(
                      icon: Icons.warning_amber,
                      label: '${count.varianceItems} variance',
                      color: Colors.orange,
                    ),
                  ],
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

  Widget _buildStatusChip(StockCountStatus status) {
    final color = status == StockCountStatus.completed ? Colors.green : Colors.blue;

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

  Widget _buildInfoChip({
    required IconData icon,
    required String label,
    Color? color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: (color ?? Colors.grey[600])!.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color ?? Colors.grey[600]),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: color ?? Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  void _showCreateDialog() {
    final warehouses = ref.read(warehousesProvider);
    Warehouse? selectedWarehouse;
    final notesController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: StatefulBuilder(
          builder: (context, setModalState) => Container(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'New Stock Count',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 24),
                Text(
                  'Warehouse',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
                const SizedBox(height: 8),
                warehouses.when(
                  data: (list) => DropdownButtonFormField<Warehouse>(
                    value: selectedWarehouse,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      hintText: 'Select warehouse',
                    ),
                    items: list
                        .map((w) => DropdownMenuItem(
                              value: w,
                              child: Text(w.name),
                            ))
                        .toList(),
                    onChanged: (value) {
                      setModalState(() => selectedWarehouse = value);
                    },
                  ),
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (_, __) => const Text('Failed to load warehouses'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(
                    labelText: 'Notes (optional)',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: selectedWarehouse == null
                        ? null
                        : () {
                            Navigator.pop(context);
                            _createCount(
                              selectedWarehouse!.id,
                              notesController.text.isNotEmpty ? notesController.text : null,
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Create Stock Count'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _createCount(String warehouseId, String? notes) async {
    final count = await ref.read(stockCountProvider.notifier).createStockCount(
          warehouseId: warehouseId,
          notes: notes,
        );

    if (count != null && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => StockCountProcessScreen(stockCount: count),
        ),
      ).then((_) {
        ref.read(stockCountProvider.notifier).refresh();
      });
    }
  }

  void _openCount(StockCount count) async {
    final loadedCount = await ref.read(stockCountProvider.notifier).getStockCount(count.id);

    if (loadedCount != null && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => StockCountProcessScreen(stockCount: loadedCount),
        ),
      ).then((_) {
        ref.read(stockCountProvider.notifier).refresh();
      });
    }
  }
}

class StockCountProcessScreen extends ConsumerStatefulWidget {
  final StockCount stockCount;

  const StockCountProcessScreen({super.key, required this.stockCount});

  @override
  ConsumerState<StockCountProcessScreen> createState() => _StockCountProcessScreenState();
}

class _StockCountProcessScreenState extends ConsumerState<StockCountProcessScreen> {
  late List<TextEditingController> _controllers;
  String? _filterText;

  @override
  void initState() {
    super.initState();
    _controllers = widget.stockCount.lines
        .map((line) => TextEditingController(
              text: line.countedQty?.toString() ?? '',
            ))
        .toList();
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  List<StockCountLine> get filteredLines {
    final currentCount = ref.read(currentStockCountProvider) ?? widget.stockCount;
    if (_filterText == null || _filterText!.isEmpty) {
      return currentCount.lines;
    }
    final filter = _filterText!.toLowerCase();
    return currentCount.lines.where((line) {
      return (line.itemCode?.toLowerCase().contains(filter) ?? false) ||
          (line.itemName?.toLowerCase().contains(filter) ?? false);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final currentCount = ref.watch(currentStockCountProvider) ?? widget.stockCount;
    final state = ref.watch(stockCountProvider);
    final isCompleted = currentCount.status == StockCountStatus.completed;

    return Scaffold(
      appBar: AppBar(
        title: Text(currentCount.countNumber),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: isCompleted ? null : _openScanner,
            tooltip: 'Scan Item',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildProgressHeader(currentCount),
          _buildSearchBar(),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filteredLines.length,
              itemBuilder: (context, index) {
                final lineIndex = currentCount.lines.indexOf(filteredLines[index]);
                return _buildLineCard(filteredLines[index], lineIndex, isCompleted);
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: isCompleted
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ElevatedButton(
                  onPressed: currentCount.isComplete && !state.isLoading
                      ? _completeCount
                      : null,
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
                      : Text(
                          currentCount.isComplete
                              ? 'Complete Stock Count'
                              : 'Count all items to complete',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ),
    );
  }

  Widget _buildProgressHeader(StockCount count) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.grey[50],
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                count.warehouseName ?? 'Warehouse',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
              Text(
                '${count.countedItems}/${count.totalItems} items',
                style: TextStyle(
                  color: count.isComplete ? Colors.green : Colors.orange,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: count.progressPercent / 100,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(
              count.isComplete ? Colors.green : AppTheme.primaryColor,
            ),
          ),
          if (count.varianceItems > 0) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.warning_amber, size: 16, color: Colors.orange[700]),
                const SizedBox(width: 4),
                Text(
                  '${count.varianceItems} items with variance',
                  style: TextStyle(color: Colors.orange[700], fontSize: 12),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search items...',
          prefixIcon: const Icon(Icons.search),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        onChanged: (value) {
          setState(() => _filterText = value);
        },
      ),
    );
  }

  Widget _buildLineCard(StockCountLine line, int index, bool isCompleted) {
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
                if (line.isCounted)
                  Icon(
                    line.hasVariance ? Icons.warning_amber : Icons.check_circle,
                    color: line.hasVariance ? Colors.orange : Colors.green,
                  ),
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'System Qty: ${line.systemQty}',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      if (line.isCounted && line.hasVariance)
                        Text(
                          'Variance: ${line.variance > 0 ? '+' : ''}${line.variance}',
                          style: TextStyle(
                            color: line.variance > 0 ? Colors.green : Colors.red,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
                  ),
                ),
                if (!isCompleted)
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
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 8,
                            ),
                            border: OutlineInputBorder(),
                          ),
                          onSubmitted: (value) {
                            final qty = int.tryParse(value) ?? 0;
                            _recordCount(line, index, qty);
                          },
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline),
                        onPressed: () => _incrementQuantity(line, index),
                        color: Colors.green[400],
                      ),
                    ],
                  )
                else
                  Text(
                    'Counted: ${line.countedQty ?? '-'}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
              ],
            ),
            if (!isCompleted) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _setToSystemQty(line, index),
                      child: const Text('Match System'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        final qty = int.tryParse(_controllers[index].text) ?? 0;
                        _recordCount(line, index, qty);
                      },
                      child: const Text('Confirm'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _incrementQuantity(StockCountLine line, int index) {
    final currentQty = int.tryParse(_controllers[index].text) ?? 0;
    final newQty = currentQty + 1;
    _controllers[index].text = newQty.toString();
    ref.read(stockCountProvider.notifier).updateLineCount(line.id, newQty);
  }

  void _decrementQuantity(StockCountLine line, int index) {
    final currentQty = int.tryParse(_controllers[index].text) ?? 0;
    if (currentQty > 0) {
      final newQty = currentQty - 1;
      _controllers[index].text = newQty.toString();
      ref.read(stockCountProvider.notifier).updateLineCount(line.id, newQty);
    }
  }

  void _setToSystemQty(StockCountLine line, int index) {
    _controllers[index].text = line.systemQty.toString();
    _recordCount(line, index, line.systemQty);
  }

  void _recordCount(StockCountLine line, int index, int quantity) async {
    final success = await ref.read(stockCountProvider.notifier).recordCount(
          line.id,
          quantity,
        );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Counted: ${line.itemName}'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 1),
        ),
      );
    }
  }

  void _openScanner() {
    Navigator.pushNamed(context, '/scan').then((result) {
      if (result != null && result is String) {
        _handleScannedBarcode(result);
      }
    });
  }

  void _handleScannedBarcode(String barcode) {
    final currentCount = ref.read(currentStockCountProvider) ?? widget.stockCount;
    final index = currentCount.lines.indexWhere(
      (line) => line.itemCode == barcode || line.itemId == barcode,
    );

    if (index >= 0) {
      _incrementQuantity(currentCount.lines[index], index);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Scanned: ${currentCount.lines[index].itemName}'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 1),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Item not in count: $barcode'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  void _completeCount() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Complete Stock Count?'),
        content: const Text(
          'This will finalize the count and apply any inventory adjustments. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Complete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await ref.read(stockCountProvider.notifier).completeStockCount();

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Stock count completed successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to complete stock count'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
