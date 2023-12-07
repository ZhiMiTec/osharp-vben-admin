import { withInstall } from '/@/utils'
import formDividerHolder from './src/FormDividerHolder.vue'
import { FormSchema, useComponentRegister } from '/@/components/Form/index'
import { createRequireFormRule } from '../../utils/osharp'

// export * from './src/typing';
export const FormDividerHolder = withInstall(formDividerHolder)
export const useFormDividerHolder = () =>
  useComponentRegister('FormDividerHolder', FormDividerHolder)

export function useFormDividerHolderItem(text, span = 24, props = {}, propsMake?): FormSchema {
  useFormDividerHolder()
  return {
    field: `_`,
    label: ``,
    labelWidth: 0,
    component: `FormDividerHolder`,
    defaultValue: '',
    colProps: { span },
    componentProps(actions) {
      return {
        text,
        ...(propsMake ? propsMake(actions) : {}),
      }
    },
    rules: [],
    ...props
  }
}
