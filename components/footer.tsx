import classNames from "classnames";
import {useRouter} from "next/router";
import useLocalStorage from "use-local-storage";
import {t} from "../src/intl";
import {TranslateIcon} from "./icons";
import {Link} from "./link";
import NextLink from "next/link"

export function Footer() {
  const {locale: currentLocale, locales, asPath} = useRouter();
  const [matomoEnabled, setMatomoEnabled] = useLocalStorage('matomo', true);

  return (
    <div className="mt-16 min-h-[80vh] bg-gradient-to-b from-slate-100 to-slate-50 bg-slate-50 bg-[length:100%_1rem] bg-no-repeat">
      <footer className="max-w-lg mx-auto px-2 py-8 flex flex-row flex-wrap gap-2 text-slate-500 text-sm">
        {Array.isArray(locales) && (
          <div className="flex w-full">
            <TranslateIcon className="mr-2"/>
            Languages:
            <ul className="flex flex-row gap-2 mx-2">
              {locales.map(locale => (
                <li key={locale} className={classNames('inline-block', {'font-semibold': locale === currentLocale})}>
                  <NextLink href={asPath} locale={locale} scroll={false}>
                    {locale}
                  </NextLink>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex-auto flex-col">

          <h2>{t('footer.used_libraries.opensource')}</h2>
          <ul className="list-disc pl-6">
            <li>
              <Link href="https://ffmpegwasm.netlify.app/" className="hover:text-slate-800">ffmpeg.wasm</Link>
              <Link href="https://www.ffmpeg.org/" className="hover:text-slate-800"> (FFmpeg,</Link>
              <Link href="https://emscripten.org/" className="hover:text-slate-800"> Emscripten)</Link>
            </li>
            <li>
              <Link href="https://nextjs.org/" className="hover:text-slate-800">next.js</Link>
              <Link href="https://reactjs.org/" className="hover:text-slate-800"> (React,</Link>
              <Link href="https://webpack.js.org/" className="hover:text-slate-800"> Webpack,</Link>
              <Link href="https://www.typescriptlang.org/" className="hover:text-slate-800"> TypeScript)</Link>
            </li>
            <li>
              <Link href="https://tailwindcss.com/" className="hover:text-slate-800">Tailwind CSS</Link>
              <Link href="https://heroicons.com/" className="hover:text-slate-800"> + Heroicons</Link>
            </li>
            <li>
              <Link href="https://www.shapedivider.app/" className="hover:text-slate-800">Custom Shape Dividers</Link>
            </li>
            <li>
              <Link href="https://www.i18next.com/" className="hover:text-slate-800">i18next</Link>
              <Link href="https://texel.marco.zone/" className="hover:text-slate-800"> (Texel,</Link>
              <Link href="https://github.com/i18next/i18next-parser" className="hover:text-slate-800"> i18next-parser)</Link>
            </li>
            <li>
              <Link href="https://matomo.org/">Matomo Analytics</Link>
              <label className="inline-block align-middle m-1 relative pr-3">
                <input type="checkbox"
                       className="peer relative z-10 block appearance-none w-3 h-3 m-0.5 checked:translate-x-3 rounded-full shadow bg-white transition"
                       checked={matomoEnabled} onChange={e => setMatomoEnabled(e.currentTarget.checked)}/>
                <span className="absolute inset-0 bg-slate-300 peer-checked:bg-red-700 rounded-full shadow-inner"/>
              </label>
            </li>
            <li>
              <Link href="https://github.com/Nemo64/clip/blob/main/package.json" className="hover:text-slate-800">and more...</Link>
            </li>
          </ul>

          <h2 className="mt-2">{t('footer.used_libraries.others')}</h2>
          <ul className="list-disc pl-6">
            <li><Link href="https://vercel.com/" className="hover:text-slate-800">Vercel</Link></li>
          </ul>

        </div>
        <div className="flex-auto flex-col">

          <h2>{t('footer.contribute.headline')}</h2>
          <ul className="list-disc pl-6">
            <li><Link href="https://github.com/Nemo64/clip">{t('footer.contribute.check')}</Link></li>
            <li><Link href="https://github.com/Nemo64/clip/issues">{t('footer.contribute.issues')}</Link></li>
          </ul>

          <h2 className="mt-2">{t('footer.author.headline', {name: 'Marco Pfeiffer'})}</h2>
          <ul className="list-disc pl-6">
            <li><Link href="https://twitter.com/TheTrueNemo">{t('footer.author.twitter')}</Link></li>
            <li><Link href="https://github.com/Nemo64">{t('footer.author.github')}</Link></li>
          </ul>

        </div>
      </footer>
    </div>
  );
}
