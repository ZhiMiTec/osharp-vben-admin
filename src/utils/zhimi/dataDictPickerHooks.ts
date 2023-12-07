import { useFormDataDictPicker } from '../../components/DataDictPicker'

export function useDataPickerHookDemoPicker() {
  useFormDataDictPicker()
  return {
    name: 'DataPickerHookDemoPicker',
    api: async () => {
      // const { Data } = (await api(null)) as any
      const Data = []
      return { Data: { DataDicts: Data } }
    },
    multiple: true,
    width: 680,
    placeholder: `请选择预算模板`,
    defaultExpandAll: false,
    // formConfig: GetXXFormConfig,
    // columns: GetXXColums,
    // getFilterItems: GetXXFilterItems,
    // 如果配置了上面的，则不需要在下面做colHook
    colHook: (o) => {
      o.find((o) => o.dataIndex === 'Code').width = '100px'
      return o
    },
  }
}
