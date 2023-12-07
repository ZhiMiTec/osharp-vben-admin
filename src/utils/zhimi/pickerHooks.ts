import { useFormApiTablePicker } from '../../components/ApiTablePicker'
import { Read } from "../../api/Common/DataDict";
import {
  GetApiTablePickerColumns,
  GetApiTablePickerFormConfig,
  getApiTablePickerFilterItems
} from '@/components/ApiTablePicker/src/data/demo'
import { set } from 'lodash-es'

export function useTeacherPicker(
  propsMake: (v: any) => any = () => {},
  extraSyncMap?: Recordable<any>,
): any {
  useFormApiTablePicker()
  return {
    component: 'ApiTablePicker',
    componentProps(actions) {
      const { formModel } = actions
      return {
        width: 600,
        api: Read,
        showSearch: true,
        labelTemplate: '[#Code#]#Name#',
        formConfig: GetApiTablePickerFormConfig,
        columns: GetApiTablePickerColumns,
        getFilterItems: getApiTablePickerFilterItems,
        valueField: 'Id',
        onChange: (v) => set(formModel, 'Id', v),
        onRowClick: (item) => {
          console.log(item)
        },
        placeholder: '请选择',
        ...(propsMake ? propsMake(actions) : {}),
      }
    },
  }
}
