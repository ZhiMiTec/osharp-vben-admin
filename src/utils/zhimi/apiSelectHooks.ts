import { GetDataDict } from '../../api/Common/DataDict'
import { FormSchema } from '../../components/Form'

export function useDataDictApiSelect(key: string, text?: string, propsMake?, config?: Recordable<any>): FormSchema | any {
  return {
    component: 'ApiSelect',
    componentProps(actions) {
      return {
        api: async () => GetDataDict({key}),
        showSearch: true,
        optionFilterProp: 'label',
        resultField: 'Data.DataDicts',
        labelField: 'Name',
        valueField: 'Id',
        placeholder: `请选择${text || ''}`,
        ...(propsMake ? propsMake(actions) : {}),
      }
    },
  }
}
