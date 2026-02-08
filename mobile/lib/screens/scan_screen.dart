import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../providers/items_provider.dart';
import '../providers/warehouse_provider.dart';
import '../models/item.dart';
import '../core/theme.dart';
import 'package:intl/intl.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> {
  MobileScannerController? _controller;
  bool _isScanning = true;
  Item? _scannedItem;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _onBarcodeDetected(BarcodeCapture capture) async {
    if (!_isScanning || _isLoading) return;

    final barcode = capture.barcodes.firstOrNull?.rawValue;
    if (barcode == null) return;

    setState(() {
      _isScanning = false;
      _isLoading = true;
      _errorMessage = null;
    });

    // Look up item by barcode, scoped to selected warehouse
    final warehouseId = ref.read(selectedWarehouseProvider)?.id;
    final item = await ref.read(itemsProvider.notifier).getItemByBarcode(barcode, warehouseId: warehouseId);

    setState(() {
      _isLoading = false;
      _scannedItem = item;
      if (item == null) {
        _errorMessage = 'Item not found for barcode: $barcode';
      }
    });
  }

  void _resetScan() {
    setState(() {
      _isScanning = true;
      _scannedItem = null;
      _errorMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan'),
        actions: [
          IconButton(
            icon: Icon(_controller?.torchEnabled ?? false
                ? Icons.flash_on
                : Icons.flash_off),
            onPressed: () {
              _controller?.toggleTorch();
              setState(() {});
            },
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: () {
              _controller?.switchCamera();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Scanner Area
          Expanded(
            flex: 2,
            child: Stack(
              children: [
                if (_isScanning)
                  MobileScanner(
                    controller: _controller,
                    onDetect: _onBarcodeDetected,
                  )
                else
                  Container(
                    color: Colors.black87,
                    child: Center(
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Icon(
                              _scannedItem != null
                                  ? Icons.check_circle
                                  : Icons.error,
                              size: 80,
                              color: _scannedItem != null
                                  ? AppTheme.successColor
                                  : AppTheme.errorColor,
                            ),
                    ),
                  ),
                // Scan overlay
                if (_isScanning)
                  Center(
                    child: Container(
                      width: 250,
                      height: 250,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.primaryColor, width: 2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Result Area
          Expanded(
            flex: 3,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: _buildResultArea(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultArea() {
    if (_isLoading) {
      return const Center(child: Text('Looking up item...'));
    }

    if (_errorMessage != null) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: AppTheme.errorColor),
          const SizedBox(height: 16),
          Text(
            _errorMessage!,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _resetScan,
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text('Scan Again'),
          ),
        ],
      );
    }

    if (_scannedItem != null) {
      return _ItemResult(item: _scannedItem!, onScanAgain: _resetScan);
    }

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.qr_code_scanner, size: 48, color: AppTheme.textSecondary),
        const SizedBox(height: 16),
        Text(
          'Point camera at a barcode',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppTheme.textSecondary,
              ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Supports QR codes and standard barcodes',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
      ],
    );
  }
}

class _ItemResult extends StatelessWidget {
  final Item item;
  final VoidCallback onScanAgain;

  const _ItemResult({required this.item, required this.onScanAgain});

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: 'RM ', decimalDigits: 2);

    return SingleChildScrollView(
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: item.isLowStock
                      ? AppTheme.warningColor.withOpacity(0.1)
                      : AppTheme.successColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Text(
                      item.stockQuantity.toString(),
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: item.isLowStock
                            ? AppTheme.warningColor
                            : AppTheme.successColor,
                      ),
                    ),
                    const Text(
                      'In Stock',
                      style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 8),
          _InfoRow('Category', item.categoryName ?? '-'),
          _InfoRow('Barcode', item.barcode ?? '-'),
          _InfoRow('Unit', item.uom),
          _InfoRow('Cost', currencyFormat.format(item.costPrice)),
          _InfoRow('Price', currencyFormat.format(item.sellingPrice)),
          const SizedBox(height: 24),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onScanAgain,
                  icon: const Icon(Icons.qr_code_scanner),
                  label: const Text('Scan Again'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    // Navigate to adjustment
                  },
                  icon: const Icon(Icons.edit),
                  label: const Text('Adjust Stock'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
