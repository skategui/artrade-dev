import axios from 'axios';
import sharp from 'sharp';

export const resizeImageFromUri = async (uri: string): Promise<Buffer> => {
  const targetSize = 1000;

  const imageBuffer = await downloadImageFromUri(uri);
  const image = sharp(imageBuffer);
  const { width, height } = await image.metadata();
  if (width && height && (width > targetSize || height > targetSize)) {
    return await image
      .resize(targetSize, targetSize, {
        fit: 'inside',
      })
      .webp({ quality: 80, alphaQuality: 100 })
      .toBuffer();
  }
  return await image.webp({ quality: 80, alphaQuality: 100 }).toBuffer();

  /*
  A quick benchmark has been made with this source image -> https://53lxjr5ajt46iktn3dy4bz4rftu4bsjpjirhmjs5jo7rclsxv5pa.arweave.net/7td0x6BM-eQqbdjxwOeRLOnAyS9KInYmXUu_ES5Xr14
  The source image is 19.37MB in more than 5000px

  1. convert to png whit sharp
  await sharp(imageBuffer).png({compressionLevel: 9}).toBuffer();
  resutl in a 73MB image (-_-)

  2. convert to avif
  await sharp(imageBuffer).avif().toBuffer();
  result in a 2MB image

  3. convert to webp
  sharp(imageBuffer).webp({quality: 60, alphaQuality: 80, effort: 6}).toBuffer();
  result in a 2.13MB image

  Resize and conversion
  Resize the image with 1000px width and then convert to webp
  sharp(imageBuffer).resize(1000).webp({quality: 60, alphaQuality: 80}).toBuffer();
  result in a 11KB image <-- chosen solution
   */
};

const downloadImageFromUri = async (uri: string): Promise<Buffer> => {
  const response = await axios.get(uri, {
    responseType: 'arraybuffer',
  });
  return Buffer.from(response.data, 'base64');
};
