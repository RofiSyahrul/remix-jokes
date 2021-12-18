/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import config from '../app/config';
import pkg from '../package.json';

type ManifestIcon = {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
};

function generateManifestIcons(): ManifestIcon[] {
  const icons: ManifestIcon[] = [];

  config.manifest.iconSizes.forEach((iconSize) => {
    const icon: ManifestIcon = {
      src: `/icons/manifest-icon-${iconSize}.maskable.png`,
      sizes: `${iconSize}x${iconSize}`,
      type: 'image/png',
      purpose: 'any'
    };

    icons.push(icon, { ...icon, purpose: 'maskable' });
  });

  return icons;
}

const writeFile = promisify(fs.writeFile);

(async () => {
  const icons = generateManifestIcons();

  const manifest = {
    name: config.manifest.name,
    short_name: config.manifest.name,
    version: pkg.version,
    description: config.manifest.description,
    background_color: config.manifest.backgroundColor,
    theme_color: config.manifest.themeColor,
    start_url: '/',
    display: 'standalone',
    scope: '/',
    icons
  };

  const publicPath = path.resolve(__dirname, '../public');
  const manifestPath = path.resolve(publicPath, 'manifest.json');

  try {
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), { encoding: 'utf-8' });
    console.log('\x1b[32m%s\x1b[0m', `Generate manifest file ${manifestPath} success 🚀`);
  } catch (error) {
    console.log(
      '\x1b[31m%s\x1b[0m',
      `Couldn't generate manifest file ${manifestPath} 🤦 . Error: ${error.message}`
    );
  }
})();
