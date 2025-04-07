export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  families: {
    regular: 'System',  // or your preferred font family
    medium: 'System',   // or your preferred font family
    bold: 'System',     // or your preferred font family
  },
};

export const getFontWeight = (weight) => {
  return typography.weights[weight] || typography.weights.regular;
};

export const getFontSize = (size) => {
  return typography.sizes[size] || typography.sizes.md;
};



