import { defHttp } from '/@/utils/http/axios'
import { OSharpPageResponse, OSharpResponse } from '../model/osharpModel'

const Route = '/Admin/Entityinfo/'

enum Api {
  Read = 'Read',
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
  ReadNode = 'ReadNode',
}

export function Read(data: any) {
  return defHttp.post<OSharpPageResponse>({
    url: Route + Api.Read,
    data,
  })
}

export function Create(data: any[]) {
  return defHttp.post<OSharpResponse>({
    url: Route + Api.Create,
    data,
  })
}

export function Update(data: any[]) {
  return defHttp.post<OSharpResponse>({
    url: Route + Api.Update,
    data,
  })
}

export function Delete(data: any[]) {
  return defHttp.post<OSharpResponse>({
    url: Route + Api.Delete,
    data,
  })
}

export function ReadNode(data: { roleId: any; moduleIds: number[] }) {
  return defHttp.get<OSharpResponse>({
    url: Route + Api.ReadNode,
    data,
  })
}
