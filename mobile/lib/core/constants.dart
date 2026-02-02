class AppConstants {
  static const String appName = 'IMS Mobile';
  static const String appVersion = '1.0.0';

  // API Configuration - Change this to your backend URL
  static const String apiBaseUrl = 'http://10.0.2.2:3000/api'; // Android emulator
  // static const String apiBaseUrl = 'http://localhost:3000/api'; // iOS simulator
  // static const String apiBaseUrl = 'https://your-api.com/api'; // Production

  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  static const String organizationKey = 'organization';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Pagination
  static const int defaultPageSize = 20;
}
