import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../providers/warehouse_provider.dart';
import '../core/theme.dart';
import '../core/constants.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // User Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                      child: Text(
                        user != null
                            ? '${user.firstName[0]}${user.lastName[0]}'
                            : '??',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      user?.fullName ?? 'User',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.email ?? '',
                      style: const TextStyle(color: AppTheme.textSecondary),
                    ),
                    if (user?.organizationName != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          user!.organizationName!,
                          style: const TextStyle(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Settings Section
            _SettingsSection(
              title: 'Settings',
              children: [
                _SettingsTile(
                  icon: Icons.warehouse,
                  title: 'Default Warehouse',
                  subtitle: 'Select your primary warehouse',
                  onTap: () => _showWarehouseSelector(context, ref),
                ),
                _SettingsTile(
                  icon: Icons.notifications,
                  title: 'Notifications',
                  subtitle: 'Manage notification preferences',
                  onTap: () {},
                ),
                _SettingsTile(
                  icon: Icons.language,
                  title: 'Language',
                  subtitle: 'English',
                  onTap: () {},
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Support Section
            _SettingsSection(
              title: 'Support',
              children: [
                _SettingsTile(
                  icon: Icons.help_outline,
                  title: 'Help & FAQ',
                  onTap: () {},
                ),
                _SettingsTile(
                  icon: Icons.info_outline,
                  title: 'About',
                  subtitle: 'Version ${AppConstants.appVersion}',
                  onTap: () => _showAboutDialog(context),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _confirmLogout(context, ref),
                icon: const Icon(Icons.logout, color: AppTheme.errorColor),
                label: const Text(
                  'Logout',
                  style: TextStyle(color: AppTheme.errorColor),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.errorColor),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
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
            final isSelected =
                ref.read(selectedWarehouseProvider)?.id == warehouse.id;

            return ListTile(
              leading: Icon(
                Icons.warehouse,
                color: isSelected ? AppTheme.primaryColor : null,
              ),
              title: Text(warehouse.name),
              subtitle: Text(warehouse.code),
              trailing: isSelected
                  ? const Icon(Icons.check, color: AppTheme.primaryColor)
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

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.inventory_2, color: AppTheme.primaryColor),
            const SizedBox(width: 8),
            const Text('IMS Mobile'),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Inventory Management System'),
            SizedBox(height: 8),
            Text(
              'Version ${AppConstants.appVersion}',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            SizedBox(height: 16),
            Text(
              'Warehouse operations app for managing inventory, '
              'picking orders, and receiving goods.',
              style: TextStyle(fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text(
              'Logout',
              style: TextStyle(color: AppTheme.errorColor),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsSection extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SettingsSection({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: AppTheme.textSecondary,
            ),
          ),
        ),
        Card(
          child: Column(
            children: children,
          ),
        ),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryColor),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
      onTap: onTap,
    );
  }
}
