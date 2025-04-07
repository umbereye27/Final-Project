import { StyleSheet } from "react-native";
import { typography } from "./typography";

export const createCommonStyles = (theme) =>
  StyleSheet.create({
    text: {
      fontFamily: theme.fonts.regular,
      fontSize: typography.sizes.base,
      color: theme.text,
    },
    heading1: {
      fontFamily: theme.fonts.bold,
      fontSize: typography.sizes["3xl"],
      color: theme.text,
      fontWeight: typography.weights.bold,
    },
    heading2: {
      fontFamily: theme.fonts.bold,
      fontSize: typography.sizes["2xl"],
      color: theme.text,
      fontWeight: typography.weights.semibold,
    },
    heading3: {
      fontFamily: theme.fonts.medium,
      fontSize: typography.sizes.xl,
      color: theme.text,
      fontWeight: typography.weights.medium,
    },
    button: {
      fontFamily: theme.fonts.medium,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.medium,
    },
  });
