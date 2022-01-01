import {t} from "../src/intl";
import {Link} from "./link";

export function Footer() {
  return (
    <footer className="max-w-lg mx-auto p-2 mt-16 flex flex-row gap-4 text-slate-500 text-sm">
      <div className="flex-auto flex-col">

        <h2>{t('footer.used_libraries.opensource')}</h2>
        <ul role="list" className="list-disc pl-6">
          <li>
            <Link href="https://github.com/ffmpegwasm/ffmpeg.wasm" className="hover:text-slate-800">ffmpeg.wasm</Link>
            <Link href="https://www.ffmpeg.org/" className="hover:text-slate-800"> (ffmpeg)</Link>
          </li>
          <li>
            <Link href="https://nextjs.org/" className="hover:text-slate-800">next.js</Link>
            <Link href="https://reactjs.org/" className="hover:text-slate-800"> (react,</Link>
            <Link href="https://webpack.js.org/" className="hover:text-slate-800"> webpack)</Link>
          </li>
          <li><Link href="https://tailwindcss.com/" className="hover:text-slate-800">tailwindcss</Link></li>
          <li><Link href="https://heroicons.com/" className="hover:text-slate-800">heroicons</Link></li>
          <li><Link href="https://www.i18next.com/" className="hover:text-slate-800">i18next</Link></li>
          <li><Link href="https://texel.marco.zone/" className="hover:text-slate-800">Texel</Link></li>
          <li><Link href="https://github.com/Nemo64/clip/blob/main/package.json" className="hover:text-slate-800">and more...</Link></li>
        </ul>

        <h2 className="mt-2">{t('footer.used_libraries.others')}</h2>
        <ul role="list" className="list-disc pl-6">
          <li><Link href="https://vercel.com/" className="hover:text-slate-800">Vercel</Link></li>
        </ul>

      </div>
      <div className="flex-auto flex-col">

        <h2>{t('footer.contribute.headline')}</h2>
        <ul role="list" className="list-disc pl-6">
          <li><Link href="https://github.com/Nemo64/clip">{t('footer.contribute.check')}</Link></li>
          <li><Link href="https://github.com/Nemo64/clip/issues">{t('footer.contribute.issues')}</Link></li>
        </ul>

        <h2 className="mt-2">{t('footer.author.headline', {name: 'Marco Pfeiffer'})}</h2>
        <ul role="list" className="list-disc pl-6">
          <li><Link href="https://twitter.com/TheTrueNemo">{t('footer.author.twitter')}</Link></li>
          <li><Link href="https://github.com/Nemo64">{t('footer.author.github')}</Link></li>
        </ul>

      </div>
    </footer>
  );
}
