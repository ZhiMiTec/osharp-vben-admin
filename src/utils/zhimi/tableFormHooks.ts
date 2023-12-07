import { GetDataDict } from '../../api/Common/DataDict'

export function useDataDictApiSelectProps(title, key, parentId = undefined) {
  return {
    showSearch: true,
    optionFilterProp: 'label',
    alwaysLoad: true,
    api: async () => {
      const ret = await GetDataDict({ key })
      if (parentId !== undefined) {
        ret.Data.DataDicts = ret.Data.DataDicts.filter((o) => o.ParentId === parentId)
      }
      return ret
    },
    resultField: 'Data.DataDicts',
    labelField: 'Name',
    valueField: 'Id',
    placeholder: `请选择${title}`,
  }
}

export function useBooleanSelectProps(title, trueText = '是', falseText = '否', trueValue?: any, falseValue?: any) {
  return {
    options: [
      { label: trueText, value: trueValue || 'true' },
      { label: falseText, value: falseValue || 'false' },
    ],
    placeholder: `请选择${title}`,
  }
}
