import { defHttp } from '/@/utils/http/axios'
import { OSharpPageResponse, OSharpResponse } from '/@/api/model/osharpModel'
import { cloneDeep } from 'lodash-es'

const Route = '/Admin/DataDict/'

export function Read(data: any) {
  return defHttp.post<OSharpPageResponse>({
    url: Route + 'Read',
    data,
  })
}

export function Create(data: any) {
  return defHttp.post<OSharpResponse>({
    url: Route + 'Create',
    data,
  })
}

export function Update(data: any) {
  return defHttp.post<OSharpResponse>({
    url: Route + 'Update',
    data,
  })
}

export function Delete(data: any) {
  return defHttp.post<OSharpResponse>({
    url: Route + 'Delete',
    data,
  })
}

export function ReadOne(params: any) {
  return defHttp.get<OSharpResponse>({
    url: Route + 'ReadOne',
    params,
  })
}

// 获取枚举
export async function GetDataDict(params: any) {
  const key = params.key
  window.GetDataDictMap = window.GetDataDictMap || {}
  if (window.GetDataDictMap[key]) {
    return cloneDeep(window.GetDataDictMap[key])
  } else {
    const ret = await defHttp.get<OSharpResponse>({
      url: Route + 'GetDataDict',
      params,
    })
    if (ret?.Data?.DataDicts) {
      window.GetDataDictMap[key] = cloneDeep(ret)
    }
    return ret
  }
}
