import FileSelector from 'web-file-selector';
export function useCustomUploader(option?) {
  const fileSelector = new FileSelector({
    accept: 'image/gif,image/jpeg,image/jpg,image/png',
    maxSize: 1,
    multiple: false,
    ...option,
  });
  return fileSelector;
}

export const FILE_ACCEPT_EXCEL =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel';

export const FILE_ACCEPT_ZIP = 'application/zip';

export const FILE_ACCEPT_IMAGE = 'image/gif,image/jpeg,image/jpg,image/png';

export const FILE_ACCEPT_IMAGE_PDF = 'application/pdf';
