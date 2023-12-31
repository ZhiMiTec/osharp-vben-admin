import { defHttp } from '../../utils/http/axios'

export async function UploadFiles(file) {
  const formData = new FormData()
  formData.append('filePath', file, file.name)
  const { Data } = await defHttp.post(
    {
      url: '/api/path-to/UploadFiles',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data;charset=UTF-8'
      }
    },
    {
      apiUrl: '',
      joinPrefix: false,
      withToken: true,
    },
  )
  const [{ FilePath, FileSize, FileExtension, SourceFileName }] = Data
  return {
    FilePath,
    FileSize,
    FileType: FileExtension,
    Name: SourceFileName,
  }
}
