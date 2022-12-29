import classNames from "classnames";
import { useRouter } from "next/router";
import useLocalStorage from "use-local-storage";
import { t } from "../src/intl";
import { TranslateIcon } from "./icons";
import { Link } from "./link";
import NextLink from "next/link";
import { ForwardedRef, forwardRef } from "react";

const FLink = forwardRef(function FooterLink(
  props: Omit<Parameters<typeof Link>[0], "className">,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  return (
    <Link
      {...props}
      className="hover:text-neutral-800 dark:hover:text-neutral-200"
      ref={ref}
    />
  );
});

export function Page_footer() {
  const { locale: currentLocale, locales, asPath } = useRouter();
  const [matomoEnabled, setMatomoEnabled] = useLocalStorage("matomo", true);

  return (
    <div className="mt-16 min-h-[80vh] pb-8 bg-slate-50 dark:bg-neutral-900 print:min-h-0">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="w-full"
      >
        <path
          d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
          className="fill-white dark:fill-neutral-800"
        />
      </svg>
      <footer className="max-w-lg mx-auto px-2 flex flex-row flex-wrap gap-2 text-neutral-500 text-sm">
        {Array.isArray(locales) && (
          <div className="flex w-full">
            <TranslateIcon className="mr-2" />
            Languages:
            <ul className="flex flex-row gap-2 mx-2">
              {locales.map((locale) => (
                <li
                  key={locale}
                  className={classNames("inline-block", {
                    "font-semibold": locale === currentLocale,
                  })}
                >
                  <NextLink href={asPath} locale={locale} scroll={false}>
                    {locale}
                  </NextLink>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex-auto flex-col">
          <h2>{t("footer.used_libraries.opensource")}</h2>
          <ul className="list-disc pl-6">
            <li>
              <FLink href="https://ffmpegwasm.netlify.app/">ffmpeg.wasm</FLink>
              {" ("}
              <FLink href="https://www.ffmpeg.org/">FFmpeg</FLink>
              {", "}
              <FLink href="https://emscripten.org/">Emscripten</FLink>
              {")"}
            </li>
            <li>
              <FLink href="https://nextjs.org/">next.js</FLink>
              {" ("}
              <FLink href="https://reactjs.org/">React</FLink>
              {", "}
              <FLink href="https://webpack.js.org/">Webpack</FLink>
              {", "}
              <FLink href="https://www.typescriptlang.org/">TypeScript</FLink>
              {")"}
            </li>
            <li>
              <FLink href="https://tailwindcss.com/">Tailwind CSS</FLink>
              {" + "}
              <FLink href="https://heroicons.com/">Heroicons</FLink>
            </li>
            <li>
              <FLink href="https://www.shapedivider.app/">
                Custom Shape Dividers
              </FLink>
            </li>
            <li>
              <FLink href="https://www.i18next.com/">i18next</FLink>
              {" ("}
              <FLink href="https://texel.marco.zone/">Texel</FLink>
              {", "}
              <FLink href="https://github.com/i18next/i18next-parser">
                i18next-parser
              </FLink>
              {")"}
            </li>
            <li>
              <FLink href="https://matomo.org/">Matomo Analytics</FLink>
              <label className="inline-block align-middle m-1 relative pr-3">
                <input
                  type="checkbox"
                  className="peer relative z-10 block appearance-none w-3 h-3 m-0.5 checked:translate-x-3 rounded-full shadow bg-white transition"
                  checked={matomoEnabled}
                  onChange={(e) => setMatomoEnabled(e.currentTarget.checked)}
                />
                <span className="absolute inset-0 bg-slate-300 peer-checked:bg-red-700 rounded-full shadow-inner" />
              </label>
            </li>
            <li>
              <FLink href="https://github.com/Nemo64/clip/blob/main/package.json">
                and more...
              </FLink>
            </li>
          </ul>

          <h2 className="mt-2">{t("footer.used_libraries.others")}</h2>
          <ul className="list-disc pl-6">
            <li>
              <FLink href="https://vercel.com/">Vercel</FLink>
            </li>
            <li>
              <FLink href="https://www.sintel.org/">Sintel</FLink>
            </li>
          </ul>
        </div>
        <div className="flex-auto flex-col">
          <h2>{t("footer.contribute.headline")}</h2>
          <ul className="list-disc pl-6">
            <li>
              <FLink href="https://github.com/Nemo64/clip">
                {t("footer.contribute.check")}
              </FLink>
            </li>
            <li>
              <FLink href="https://github.com/Nemo64/clip/issues">
                {t("footer.contribute.issues")}
              </FLink>
            </li>
          </ul>

          <h2 className="mt-2">
            {t("footer.author.headline", { name: "Marco Pfeiffer" })}
          </h2>
          <ul className="list-disc pl-6">
            <li>
              <FLink href="https://www.marco.zone/">
                {t("footer.author.website")}
              </FLink>
            </li>
            <li>
              <FLink href="https://twitter.com/TheTrueNemo">
                {t("footer.author.twitter")}
              </FLink>
            </li>
            <li>
              <FLink href="https://github.com/Nemo64">
                {t("footer.author.github")}
              </FLink>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
