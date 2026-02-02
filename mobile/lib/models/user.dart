class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? role;
  final String organizationId;
  final String? organizationName;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.role,
    required this.organizationId,
    this.organizationName,
  });

  String get fullName => '$firstName $lastName';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      role: json['role'] as String?,
      organizationId: json['organizationId'] as String,
      organizationName: json['organization']?['name'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'role': role,
      'organizationId': organizationId,
    };
  }
}

class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final User user;

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}
