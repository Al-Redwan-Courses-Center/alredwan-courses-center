import plugin from "tailwindcss/plugin";

export default plugin(function ({ matchUtilities, theme }) {
  matchUtilities(
    {
      separators: (value) => ({
        "&:not(:first-child)": {
          borderInlineStartWidth: "1px",
          borderStyle: "solid",
          paddingInlineStart: value,
        },
        "&:not(:last-child)": {
          paddingInlineEnd: value,
        },
      }),
    },
    {
      values: theme("spacing"),
    },
  );
});
