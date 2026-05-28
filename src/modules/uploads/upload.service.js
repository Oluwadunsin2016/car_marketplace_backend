const cloudinary = require('../../config/cloudinary');
const { cloudinary: cloudinaryConfig } = require('../../config/env');

const uploadFile = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || cloudinaryConfig.folder,
        resource_type: options.resourceType || 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      },
    );

    stream.end(file.buffer);
  });
};

const uploadImage = (file) => uploadFile(file, { resourceType: 'image' });

const uploadImages = async (files = []) => {
  if (!files || files.length === 0) return [];

  const results = await Promise.allSettled(files.map(uploadImage));
  const uploadedImages = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
  const failedUpload = results.find((result) => result.status === 'rejected');

  if (failedUpload) {
    await deleteImagesByPublicIds(uploadedImages.map((image) => image.publicId));
    throw failedUpload.reason;
  }

  return uploadedImages;
};

const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  try {
    const pathname = new URL(url).pathname;
    const uploadIndex = pathname.indexOf('/upload/');

    if (uploadIndex === -1) return null;

    const afterUpload = pathname.slice(uploadIndex + '/upload/'.length);
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');

    return withoutVersion.replace(/\.[^.]+$/, '');
  } catch (_error) {
    return null;
  }
};

const deleteImageByUrl = async (url) => {
  const publicId = extractPublicIdFromUrl(url);

  if (!publicId) return null;

  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

const deleteFileByPublicId = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;

  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

const deleteImagesByPublicIds = async (publicIds = []) => {
  const uniquePublicIds = [...new Set(publicIds.filter(Boolean))];

  await Promise.allSettled(uniquePublicIds.map((publicId) => deleteFileByPublicId(publicId, 'image')));
};

const deleteImagesByUrls = async (urls = []) => {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];

  await Promise.allSettled(uniqueUrls.map((url) => deleteImageByUrl(url)));
};

module.exports = {
  deleteFileByPublicId,
  deleteImageByUrl,
  deleteImagesByPublicIds,
  deleteImagesByUrls,
  extractPublicIdFromUrl,
  uploadFile,
  uploadImage,
  uploadImages,
};
