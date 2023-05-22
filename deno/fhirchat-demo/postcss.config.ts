import postcssSass from "npm:@csstools/postcss-sass";
import autoprefixer from "npm:autoprefixer";
import gridKiss from "npm:postcss-grid-kiss";
import postcssPresetEnv from "npm:postcss-preset-env";
// import csso from "npm:postcss-csso";
import customMediaPlugin from "npm:postcss-custom-media";

export const config = {
  plugins: [
    postcssSass(),
    gridKiss({ fallback: true }),
    customMediaPlugin(),
    postcssPresetEnv({
      stage: 3,
      features: {
        "nesting-rules": true,
        "custom-media-queries": true,
        "media-query-ranges": true,
      },
    }),
    autoprefixer(),
    // csso(),
  ],
};
