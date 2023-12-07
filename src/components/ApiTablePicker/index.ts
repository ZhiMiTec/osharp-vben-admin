import { withInstall } from '/@/utils'
import apiTablePicker from './src/ApiTablePicker.vue'
import { useComponentRegister } from '/@/components/Form/index'

// export * from './src/typing';
export const ApiTablePicker = withInstall(apiTablePicker)
export const useFormApiTablePicker = () => useComponentRegister('ApiTablePicker', ApiTablePicker)
