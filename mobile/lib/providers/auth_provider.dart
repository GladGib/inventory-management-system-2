import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_client.dart';
import '../core/constants.dart';
import '../models/user.dart';

enum AuthStatus { initial, authenticated, unauthenticated, loading }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;

  AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.error,
  });

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? error,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient = ApiClient();

  AuthNotifier() : super(AuthState()) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    state = state.copyWith(status: AuthStatus.loading);

    final hasToken = await _apiClient.hasToken();
    if (hasToken) {
      // Try to load cached user
      final prefs = await SharedPreferences.getInstance();
      final userData = prefs.getString(AppConstants.userDataKey);
      if (userData != null) {
        try {
          final user = User.fromJson(jsonDecode(userData));
          state = state.copyWith(status: AuthStatus.authenticated, user: user);
          return;
        } catch (_) {}
      }
      // If no cached user, try to fetch from API
      try {
        final response = await _apiClient.dio.get('/auth/me');
        final user = User.fromJson(response.data['data']);
        await _saveUser(user);
        state = state.copyWith(status: AuthStatus.authenticated, user: user);
      } catch (_) {
        await _apiClient.clearTokens();
        state = state.copyWith(status: AuthStatus.unauthenticated);
      }
    } else {
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);

    try {
      final response = await _apiClient.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      final authResponse = AuthResponse.fromJson(response.data['data']);
      await _apiClient.setTokens(authResponse.accessToken, authResponse.refreshToken);
      await _saveUser(authResponse.user);

      state = state.copyWith(
        status: AuthStatus.authenticated,
        user: authResponse.user,
      );
      return true;
    } catch (e) {
      String errorMessage = 'Login failed';
      if (e is Exception) {
        errorMessage = e.toString();
      }
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: errorMessage,
      );
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _apiClient.dio.post('/auth/logout');
    } catch (_) {}

    await _apiClient.clearTokens();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.userDataKey);

    state = AuthState(status: AuthStatus.unauthenticated);
  }

  Future<void> _saveUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.userDataKey, jsonEncode(user.toJson()));
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
