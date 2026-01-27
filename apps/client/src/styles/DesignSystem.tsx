
import React, { createContext, useState, useContext } from 'react';
import { theme, ConfigProvider } from 'antd';
import { colors as colorPalette, typography, spacing, borderRadius, shadows, breakpoints, transitions } from './theme'; // Assuming these are in a separate file now

// Define available theme colors
export const availableColors: Record<string, string> = {
  blue: colorPalette.primary[500],
  green: colorPalette.success[500],
  orange: colorPalette.warning[500],
  red: colorPalette.error[500],
  purple: '#8B5CF6',
  pink: '#EC4899',
};

// Create Theme Context
interface ThemeContextType {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: availableColors.blue,
  setPrimaryColor: () => {},
});

// Create a hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Create Ant Design theme configuration function
export const createAntdTheme = (primaryColor: string) => ({
  token: {
    colorPrimary: primaryColor,
    colorInfo: primaryColor,
    colorSuccess: colorPalette.success[500],
    colorWarning: colorPalette.warning[500],
    colorError: colorPalette.error[500],
    colorTextBase: colorPalette.gray[800],
    colorBgBase: colorPalette.gray[50],
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.base,
    borderRadius: borderRadius.DEFAULT,
  },
  components: {
    Button: {
      borderRadius: borderRadius.md,
      controlHeight: 40,
      fontWeight: typography.fontWeight.medium,
    },
    Input: {
      borderRadius: borderRadius.md,
      controlHeight: 40,
    },
    Select: {
      borderRadius: borderRadius.md,
      controlHeight: 40,
    },
    Table: {
      borderRadius: borderRadius.md,
      borderColor: colorPalette.gray[200],
    },
    Card: {
      borderRadius: borderRadius.lg,
      boxShadow: shadows.sm,
    },
    Form: {
      itemMarginBottom: spacing[4],
    },
    Modal: {
      borderRadius: borderRadius.lg,
    },
    Tag: {
      borderRadius: borderRadius.md,
    },
    Switch: {}, // Ensure Switch is recognized by the theme
  },
});

// Export design system provider component
export const DesignSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState(availableColors.blue);
  const antdTheme = createAntdTheme(primaryColor);

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      <ConfigProvider theme={antdTheme}>
        <div style={{
          fontFamily: typography.fontFamily,
          color: colorPalette.gray[800],
          backgroundColor: colorPalette.gray[50],
          lineHeight: typography.lineHeight.normal,
        }}>
          {children}
        </div>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export { colorPalette as colors, typography, spacing, borderRadius, shadows, breakpoints, transitions };

export default DesignSystemProvider;
