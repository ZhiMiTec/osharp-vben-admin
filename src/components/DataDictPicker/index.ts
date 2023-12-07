import { withInstall } from '/@/utils'
import dataDictPicker from './src/DataDictPicker.vue'
import { useComponentRegister } from '/@/components/Form/index'

// export * from './src/typing';
export const DataDictPicker = withInstall(dataDictPicker)
export const useFormDataDictPicker = () => useComponentRegister('DataDictPicker', DataDictPicker)
