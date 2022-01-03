import i18next, {Resource} from 'i18next';

const resources: Resource = {};

// @ts-ignore
const resourceContext = require.context('../locales', true, /\.json$/);
for (const key of resourceContext.keys()) {
  const [locale, namespace] = key.slice(2, -5).split('/');
  resources[locale] ??= {};
  resources[locale][namespace] = resourceContext(key);
}

i18next.init({
  lng: 'en',
  debug: process.env.NODE_ENV === 'development',
  resources,
});

export const t = i18next.t.bind(i18next);
