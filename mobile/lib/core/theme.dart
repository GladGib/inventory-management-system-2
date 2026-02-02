import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// App Design System Colors
class AppColors {
  // Primary Colors
  static const Color primary = Color(0xFF1677FF);
  static const Color primaryHover = Color(0xFF4096FF);
  static const Color primaryActive = Color(0xFF0958D9);
  static const Color primaryBg = Color(0xFFE6F4FF);

  // Semantic Colors
  static const Color success = Color(0xFF52C41A);
  static const Color successBg = Color(0xFFF6FFED);
  static const Color warning = Color(0xFFFAAD14);
  static const Color warningBg = Color(0xFFFFFBE6);
  static const Color error = Color(0xFFFF4D4F);
  static const Color errorBg = Color(0xFFFFF2F0);
  static const Color info = Color(0xFF1677FF);
  static const Color infoBg = Color(0xFFE6F4FF);

  // Neutral Colors
  static const Color title = Color(0xFF141414);
  static const Color text = Color(0xFF262626);
  static const Color textSecondary = Color(0xFF595959);
  static const Color textTertiary = Color(0xFF8C8C8C);
  static const Color textQuaternary = Color(0xFFBFBFBF);
  static const Color border = Color(0xFFD9D9D9);
  static const Color borderLight = Color(0xFFF0F0F0);
  static const Color divider = Color(0xFFF0F0F0);
  static const Color background = Color(0xFFF5F5F5);
  static const Color backgroundLight = Color(0xFFFAFAFA);
  static const Color surface = Color(0xFFFFFFFF);

  // Dark Theme Colors
  static const Color darkBackground = Color(0xFF141414);
  static const Color darkSurface = Color(0xFF1F1F1F);
  static const Color darkBorder = Color(0xFF434343);
  static const Color darkText = Color(0xFFE6E6E6);
  static const Color darkTextSecondary = Color(0xFFA6A6A6);
}

/// App Typography
class AppTypography {
  static const String fontFamily = 'Inter';

  static const TextStyle h1 = TextStyle(
    fontSize: 30,
    fontWeight: FontWeight.w700,
    height: 1.27,
    color: AppColors.title,
  );

  static const TextStyle h2 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.33,
    color: AppColors.title,
  );

  static const TextStyle h3 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 1.4,
    color: AppColors.title,
  );

  static const TextStyle h4 = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    height: 1.5,
    color: AppColors.title,
  );

  static const TextStyle body = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.57,
    color: AppColors.text,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    height: 1.57,
    color: AppColors.text,
  );

  static const TextStyle small = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.67,
    color: AppColors.textSecondary,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.67,
    color: AppColors.textTertiary,
  );

  static const TextStyle label = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    height: 1.57,
    color: AppColors.textSecondary,
  );

  static const TextStyle mono = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    fontFamily: 'RobotoMono',
    color: AppColors.text,
  );
}

/// App Spacing
class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

/// App Radius
class AppRadius {
  static const double xs = 2;
  static const double sm = 4;
  static const double md = 6;
  static const double lg = 8;
  static const double xl = 12;
  static const double full = 9999;

  static BorderRadius get borderXs => BorderRadius.circular(xs);
  static BorderRadius get borderSm => BorderRadius.circular(sm);
  static BorderRadius get borderMd => BorderRadius.circular(md);
  static BorderRadius get borderLg => BorderRadius.circular(lg);
  static BorderRadius get borderXl => BorderRadius.circular(xl);
  static BorderRadius get borderFull => BorderRadius.circular(full);
}

/// App Shadows
class AppShadows {
  static const List<BoxShadow> sm = [
    BoxShadow(
      color: Color(0x0D000000),
      blurRadius: 2,
      offset: Offset(0, 1),
    ),
  ];

  static const List<BoxShadow> md = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 3,
      offset: Offset(0, 1),
    ),
    BoxShadow(
      color: Color(0x0F000000),
      blurRadius: 2,
      offset: Offset(0, 1),
    ),
  ];

  static const List<BoxShadow> lg = [
    BoxShadow(
      color: Color(0x12000000),
      blurRadius: 6,
      offset: Offset(0, 4),
    ),
    BoxShadow(
      color: Color(0x0F000000),
      blurRadius: 4,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> xl = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 15,
      offset: Offset(0, 10),
    ),
    BoxShadow(
      color: Color(0x0D000000),
      blurRadius: 6,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> card = [
    BoxShadow(
      color: Color(0x0A000000),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];
}

/// Main Theme Class
class AppTheme {
  // Legacy color references for backward compatibility
  static const Color primaryColor = AppColors.primary;
  static const Color successColor = AppColors.success;
  static const Color warningColor = AppColors.warning;
  static const Color errorColor = AppColors.error;
  static const Color textColor = AppColors.text;
  static const Color textSecondary = AppColors.textSecondary;
  static const Color borderColor = AppColors.border;
  static const Color backgroundColor = AppColors.background;

  /// Light Theme
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
        primary: AppColors.primary,
        onPrimary: Colors.white,
        secondary: AppColors.primaryBg,
        onSecondary: AppColors.primary,
        error: AppColors.error,
        onError: Colors.white,
        surface: AppColors.surface,
        onSurface: AppColors.text,
      ),
      scaffoldBackgroundColor: AppColors.background,

      // AppBar Theme
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.title,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black.withOpacity(0.05),
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
          statusBarBrightness: Brightness.light,
        ),
        titleTextStyle: AppTypography.h4,
        iconTheme: const IconThemeData(
          color: AppColors.text,
          size: 22,
        ),
      ),

      // Card Theme
      cardTheme: CardTheme(
        elevation: 0,
        color: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.borderLg,
          side: const BorderSide(color: AppColors.borderLight, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),

      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: AppRadius.borderMd,
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppRadius.borderMd,
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppRadius.borderMd,
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppRadius.borderMd,
          borderSide: const BorderSide(color: AppColors.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: AppRadius.borderMd,
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        hintStyle: AppTypography.body.copyWith(color: AppColors.textTertiary),
        labelStyle: AppTypography.label,
        errorStyle: AppTypography.small.copyWith(color: AppColors.error),
      ),

      // Elevated Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.primary.withOpacity(0.6),
          disabledForegroundColor: Colors.white.withOpacity(0.8),
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          minimumSize: const Size(0, 48),
          shape: RoundedRectangleBorder(
            borderRadius: AppRadius.borderMd,
          ),
          textStyle: AppTypography.bodyMedium.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Outlined Button Theme
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          backgroundColor: Colors.transparent,
          disabledForegroundColor: AppColors.textTertiary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          minimumSize: const Size(0, 48),
          shape: RoundedRectangleBorder(
            borderRadius: AppRadius.borderMd,
          ),
          side: const BorderSide(color: AppColors.border),
          textStyle: AppTypography.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Text Button Theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          minimumSize: const Size(0, 40),
          shape: RoundedRectangleBorder(
            borderRadius: AppRadius.borderMd,
          ),
          textStyle: AppTypography.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Floating Action Button Theme
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.borderXl,
        ),
      ),

      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textTertiary,
        selectedLabelStyle: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w400,
        ),
        elevation: 8,
      ),

      // Navigation Bar Theme (Material 3)
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.primaryBg,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppTypography.small.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w600,
            );
          }
          return AppTypography.small;
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(
              color: AppColors.primary,
              size: 24,
            );
          }
          return const IconThemeData(
            color: AppColors.textTertiary,
            size: 24,
          );
        }),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        height: 64,
      ),

      // List Tile Theme
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.borderLg,
        ),
        titleTextStyle: AppTypography.bodyMedium,
        subtitleTextStyle: AppTypography.small,
        leadingAndTrailingTextStyle: AppTypography.caption,
      ),

      // Chip Theme
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.backgroundLight,
        selectedColor: AppColors.primaryBg,
        labelStyle: AppTypography.small,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.borderFull,
          side: const BorderSide(color: AppColors.borderLight),
        ),
      ),

      // Snackbar Theme
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.title,
        contentTextStyle: AppTypography.body.copyWith(color: Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.borderLg,
        ),
        behavior: SnackBarBehavior.floating,
        elevation: 4,
      ),

      // Dialog Theme
      dialogTheme: DialogTheme(
        backgroundColor: AppColors.surface,
        elevation: 16,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.borderXl,
        ),
        titleTextStyle: AppTypography.h4,
        contentTextStyle: AppTypography.body,
      ),

      // Bottom Sheet Theme
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: AppColors.surface,
        elevation: 8,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(16),
          ),
        ),
        dragHandleColor: AppColors.borderLight,
        dragHandleSize: const Size(40, 4),
      ),

      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: AppColors.divider,
        thickness: 1,
        space: 1,
      ),

      // Icon Theme
      iconTheme: const IconThemeData(
        color: AppColors.text,
        size: 24,
      ),

      // Progress Indicator Theme
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primary,
        linearTrackColor: AppColors.primaryBg,
        circularTrackColor: AppColors.primaryBg,
      ),

      // Text Theme
      textTheme: const TextTheme(
        displayLarge: AppTypography.h1,
        displayMedium: AppTypography.h2,
        displaySmall: AppTypography.h3,
        headlineMedium: AppTypography.h4,
        bodyLarge: AppTypography.body,
        bodyMedium: AppTypography.body,
        bodySmall: AppTypography.small,
        labelLarge: AppTypography.label,
        labelMedium: AppTypography.caption,
      ),
    );
  }

  /// Dark Theme
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.dark,
        primary: AppColors.primary,
        onPrimary: Colors.white,
        secondary: AppColors.primaryBg,
        onSecondary: AppColors.primary,
        error: AppColors.error,
        onError: Colors.white,
        surface: AppColors.darkSurface,
        onSurface: AppColors.darkText,
      ),
      scaffoldBackgroundColor: AppColors.darkBackground,

      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: AppColors.darkSurface,
        foregroundColor: AppColors.darkText,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
          statusBarBrightness: Brightness.dark,
        ),
        titleTextStyle: AppTypography.h4.copyWith(color: AppColors.darkText),
        iconTheme: const IconThemeData(
          color: AppColors.darkText,
          size: 22,
        ),
      ),

      cardTheme: CardTheme(
        elevation: 0,
        color: AppColors.darkSurface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.borderLg,
          side: const BorderSide(color: AppColors.darkBorder, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),

      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppColors.darkSurface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.darkTextSecondary,
        elevation: 8,
      ),
    );
  }
}
