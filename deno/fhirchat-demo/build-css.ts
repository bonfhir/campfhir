import { debounce } from "$std/async/mod.ts";
import { relative, resolve } from "$std/path/mod.ts";
import { writeAll } from "https://deno.land/std@0.188.0/streams/write_all.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import postcssScss from "npm:postcss-scss";
import postcss from "postcss/mod.js";
import { config } from "$denoRoot/fhirchat-demo/postcss.config.ts";

const STYLES_INPUT_DIRECTORY = "styles";
const STYLES_DEPENDENCIES = [
  {
    url: "https://github.com/jgthms/bulma/releases/download/",
    version: "0.9.4",
  },
];

async function main() {
  await ensureDependenciesArePresent();
  await watchAndBuild();
}

async function ensureDependenciesArePresent() {
  const sourcesDirectory = `${STYLES_INPUT_DIRECTORY}/sources`;
  for await (const dependency of STYLES_DEPENDENCIES) {
    const { url, version } = dependency;

    const currentBulmaVersionSourceDirectory = `${sourcesDirectory}/${version}`;

    if (!(await exists(currentBulmaVersionSourceDirectory))) {
      console.log("Downloading ", currentBulmaVersionSourceDirectory);
      if (!(await exists(sourcesDirectory))) {
        await Deno.mkdir(sourcesDirectory);
      }

      const bulmaSourceZipURL = `${url}${version}/bulma-${version}.zip`;
      const bulmaSourceZipPath = `${sourcesDirectory}/bulma-${version}.zip`;

      await downloadSource(bulmaSourceZipURL, bulmaSourceZipPath);
      await decompress(bulmaSourceZipPath, currentBulmaVersionSourceDirectory);

      await Deno.remove(bulmaSourceZipPath);
    }
  }
}

async function watchAndBuild() {
  console.log("Started watching directory: ", STYLES_INPUT_DIRECTORY);
  const watcher = Deno.watchFs([STYLES_INPUT_DIRECTORY], { recursive: false });
  for await (const event of watcher) {
    const { paths } = event;
    console.log("PostCSS processing: ", paths);
    paths
      .filter((path) => !path.endsWith("sources"))
      .forEach((path) => {
        debouncedBuildStyles(path);
      });
  }
}

async function buildStyles(path: string) {
  try {
    const css = await Deno.readTextFile(path);

    const { css: outputCss } = await postcss(config.plugins).process(css, {
      from: path,
      syntax: postcssScss,
    });

    const __dirname = resolve();
    const outputPath = `./static/${
      relative(
        __dirname,
        path.replace(".scss", ".css"),
      )
    }`;
    console.log(`Updating styles for ${outputPath}`);
    await Deno.writeTextFile(outputPath, outputCss);
  } catch (error: unknown) {
    console.error(`Error building styles for path ${path}: ${error as string}`);
  }
}

const debouncedBuildStyles = debounce(async (path: string) => {
  await buildStyles(path);
}, 200);

const stylesOutputDirectory = `static/${STYLES_INPUT_DIRECTORY}`;
try {
  Deno.statSync(stylesOutputDirectory);
} catch (error: unknown) {
  if (error instanceof Deno.errors.NotFound) {
    Deno.mkdir(stylesOutputDirectory);
  }
}

const exists = async (pathname: string): Promise<boolean> => {
  try {
    await Deno.stat(pathname);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw error;
    }
  }
};

async function downloadSource(
  source: string,
  destination: string,
): Promise<void> {
  console.log("Downloading source from: ", source);
  const response = await fetch(source);
  const blob = await response.blob();

  const buf = await blob.arrayBuffer();
  const data = new Uint8Array(buf);

  const file = await Deno.create(destination);
  await writeAll(file, data);

  Deno.close(file.rid);
}

// RUN!
await main();
