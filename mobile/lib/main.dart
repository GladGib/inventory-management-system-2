import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/main_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: IMSApp()));
}

class IMSApp extends ConsumerWidget {
  const IMSApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'IMS Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    switch (authState.status) {
      case AuthStatus.initial:
      case AuthStatus.loading:
        return const Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.inventory_2,
                  size: 64,
                  color: AppTheme.primaryColor,
                ),
                SizedBox(height: 24),
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text(
                  'Loading...',
                  style: TextStyle(color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
        );
      case AuthStatus.authenticated:
        return const MainScreen();
      case AuthStatus.unauthenticated:
        return const LoginScreen();
    }
  }
}
