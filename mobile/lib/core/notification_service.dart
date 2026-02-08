import 'dart:async';
import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'api_client.dart';
import 'theme.dart';

/// Notification data parsed from FCM or local notification
class NotificationPayload {
  final String title;
  final String body;
  final String type;
  final String? referenceId;

  NotificationPayload({
    required this.title,
    required this.body,
    required this.type,
    this.referenceId,
  });

  factory NotificationPayload.fromMap(Map<String, dynamic> data) {
    return NotificationPayload(
      title: data['title'] as String? ?? '',
      body: data['body'] as String? ?? '',
      type: data['type'] as String? ?? '',
      referenceId: data['referenceId'] as String?,
    );
  }
}

/// State for notification service
class NotificationState {
  final bool isInitialized;
  final bool hasPermission;
  final String? fcmToken;
  final NotificationPayload? lastNotification;

  NotificationState({
    this.isInitialized = false,
    this.hasPermission = false,
    this.fcmToken,
    this.lastNotification,
  });

  NotificationState copyWith({
    bool? isInitialized,
    bool? hasPermission,
    String? fcmToken,
    NotificationPayload? lastNotification,
    bool clearLastNotification = false,
  }) {
    return NotificationState(
      isInitialized: isInitialized ?? this.isInitialized,
      hasPermission: hasPermission ?? this.hasPermission,
      fcmToken: fcmToken ?? this.fcmToken,
      lastNotification: clearLastNotification
          ? null
          : (lastNotification ?? this.lastNotification),
    );
  }
}

/// Service that manages push notifications via Firebase Cloud Messaging (FCM).
///
/// To configure push notifications:
/// 1. Set up a Firebase project at https://console.firebase.google.com/
/// 2. Add your Android/iOS apps to the project
/// 3. Download google-services.json (Android) and/or GoogleService-Info.plist (iOS)
/// 4. Place them in the appropriate directories (see .example files)
///
/// If Firebase is not configured, the service will initialize gracefully
/// without FCM capabilities -- the app will still function normally.
class NotificationService extends StateNotifier<NotificationState> {
  final ApiClient _apiClient = ApiClient();

  // Stream controller for foreground notifications to show in-app banners
  final _foregroundNotificationController =
      StreamController<NotificationPayload>.broadcast();

  Stream<NotificationPayload> get foregroundNotifications =>
      _foregroundNotificationController.stream;

  // Stream controller for notification taps to handle navigation
  final _notificationTapController =
      StreamController<NotificationPayload>.broadcast();

  Stream<NotificationPayload> get notificationTaps =>
      _notificationTapController.stream;

  NotificationService() : super(NotificationState()) {
    _initialize();
  }

  /// Initialize the notification service
  Future<void> _initialize() async {
    try {
      // Ensure Firebase is initialized
      await Firebase.initializeApp();

      final messaging = FirebaseMessaging.instance;

      // Request permission (especially important for iOS)
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      final hasPermission =
          settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional;

      if (!hasPermission) {
        state = state.copyWith(isInitialized: true, hasPermission: false);
        return;
      }

      // Get FCM token
      final token = await messaging.getToken();

      // Listen for token refresh
      messaging.onTokenRefresh.listen(_onTokenRefresh);

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle background/terminated message taps
      FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTap);

      // Check if app was opened from a terminated state via notification
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleMessageTap(initialMessage);
      }

      state = state.copyWith(
        isInitialized: true,
        hasPermission: true,
        fcmToken: token,
      );

      // Register token with the backend if we have one
      if (token != null) {
        final platform = _detectPlatform();
        await registerToken(token, platform);
      }
    } catch (e) {
      // Firebase may not be configured yet (missing google-services.json or
      // GoogleService-Info.plist). Fall back to a non-FCM state so the app
      // still works.
      debugPrint('Firebase initialization failed: $e');
      state = state.copyWith(
        isInitialized: true,
        hasPermission: false,
        fcmToken: null,
      );
    }
  }

  /// Handle a foreground RemoteMessage from FCM
  void _handleForegroundMessage(RemoteMessage message) {
    final data = <String, dynamic>{
      'title': message.notification?.title ?? '',
      'body': message.notification?.body ?? '',
      ...message.data,
    };
    handleForegroundNotification(data);
  }

  /// Handle a notification tap (from background or terminated state)
  void _handleMessageTap(RemoteMessage message) {
    final data = <String, dynamic>{
      'title': message.notification?.title ?? '',
      'body': message.notification?.body ?? '',
      ...message.data,
    };
    handleNotificationTap(data);
  }

  /// Request notification permission from the user
  Future<bool> requestPermission() async {
    try {
      final messaging = FirebaseMessaging.instance;
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      final granted =
          settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional;

      state = state.copyWith(hasPermission: granted);
      return granted;
    } catch (e) {
      debugPrint('Failed to request notification permission: $e');
      state = state.copyWith(hasPermission: false);
      return false;
    }
  }

  /// Register the device token with the backend
  Future<void> registerToken(String token, String platform) async {
    try {
      await _apiClient.dio.post('/devices/register', data: {
        'token': token,
        'platform': platform,
        'deviceName': null, // Could use device_info_plus to get this
      });

      state = state.copyWith(fcmToken: token);
    } catch (e) {
      // Token registration failed; will retry on next app start
      debugPrint('Failed to register device token: $e');
    }
  }

  /// Unregister the device token (e.g., on logout)
  Future<void> unregisterToken() async {
    final token = state.fcmToken;
    if (token == null) return;

    try {
      await _apiClient.dio.delete('/devices/$token');
      state = state.copyWith(fcmToken: null);
    } catch (e) {
      debugPrint('Failed to unregister device token: $e');
    }
  }

  /// Called when FCM token is refreshed
  void _onTokenRefresh(String newToken) {
    // Re-register with backend
    final platform = _detectPlatform();
    registerToken(newToken, platform);
  }

  /// Handle foreground notification - show in-app banner
  void handleForegroundNotification(Map<String, dynamic> data) {
    final payload = NotificationPayload.fromMap(data);
    state = state.copyWith(lastNotification: payload);
    _foregroundNotificationController.add(payload);
  }

  /// Handle notification tap - navigate to relevant screen
  void handleNotificationTap(Map<String, dynamic> data) {
    final payload = NotificationPayload.fromMap(data);
    _notificationTapController.add(payload);
  }

  /// Clear the last notification state
  void clearLastNotification() {
    state = state.copyWith(clearLastNotification: true);
  }

  /// Determine which screen to navigate to based on notification type
  static String getRouteForNotification(NotificationPayload payload) {
    switch (payload.type) {
      case 'PICK_LIST':
        return '/pick-list/${payload.referenceId}';
      case 'LOW_STOCK':
        return '/item/${payload.referenceId}';
      case 'GRN':
        return '/grn/${payload.referenceId}';
      default:
        return '/notifications';
    }
  }

  String _detectPlatform() {
    try {
      if (Platform.isAndroid) return 'android';
      if (Platform.isIOS) return 'ios';
    } catch (_) {
      // Platform may not be available in tests
    }
    return 'android';
  }

  @override
  void dispose() {
    _foregroundNotificationController.close();
    _notificationTapController.close();
    super.dispose();
  }
}

/// Provider for notification service
final notificationServiceProvider =
    StateNotifierProvider<NotificationService, NotificationState>((ref) {
  return NotificationService();
});

/// Provider for FCM token
final fcmTokenProvider = Provider<String?>((ref) {
  return ref.watch(notificationServiceProvider).fcmToken;
});

/// Provider for whether notifications have permission
final notificationPermissionProvider = Provider<bool>((ref) {
  return ref.watch(notificationServiceProvider).hasPermission;
});

/// Widget that shows an in-app notification banner
class InAppNotificationBanner extends ConsumerStatefulWidget {
  final Widget child;

  const InAppNotificationBanner({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<InAppNotificationBanner> createState() =>
      _InAppNotificationBannerState();
}

class _InAppNotificationBannerState
    extends ConsumerState<InAppNotificationBanner> {
  StreamSubscription<NotificationPayload>? _subscription;
  NotificationPayload? _currentNotification;
  bool _isVisible = false;

  @override
  void initState() {
    super.initState();
    final service = ref.read(notificationServiceProvider.notifier);
    _subscription = service.foregroundNotifications.listen(_showBanner);
  }

  void _showBanner(NotificationPayload payload) {
    setState(() {
      _currentNotification = payload;
      _isVisible = true;
    });

    // Auto-dismiss after 4 seconds
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        setState(() => _isVisible = false);
      }
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_isVisible && _currentNotification != null)
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            right: 16,
            child: Material(
              elevation: 8,
              borderRadius: AppRadius.borderXl,
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: AppRadius.borderXl,
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primaryBg,
                        borderRadius: AppRadius.borderLg,
                      ),
                      child: const Icon(
                        Icons.notifications,
                        color: AppColors.primary,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _currentNotification!.title,
                            style: AppTypography.bodyMedium,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            _currentNotification!.body,
                            style: AppTypography.small,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _isVisible = false),
                      child: const Icon(
                        Icons.close,
                        size: 18,
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
