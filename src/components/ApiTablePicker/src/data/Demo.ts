import { BasicColumn, FormProps } from '../../../Table'

export const GetApiTablePickerColumns: BasicColumn[] = [
  {
    title: 'Id',
    dataIndex: 'Id',
    width: 150,
    align: 'left',
  },
  {
    title: '专利名称',
    dataIndex: 'Name',
    width: 200,
    align: 'left',
  },
]

export const GetApiTablePickerFormConfig: FormProps = {
  labelWidth: 0,
  showActionButtonGroup: false,
  autoSubmitOnEnter: true,
  schemas: [
    {
      field: 'Keyword',
      label: '',
      colProps: { span: 24 },
      component: 'Input',
      componentProps: {
        placeholder: '请输入关键词(按下回车搜索)',
      },
    },
  ],
}

export function getApiTablePickerFilterItems(valueMap: any) {
  const { Keyword } = valueMap
  return [
    { key: 'Keyword', type: 'like', value: Keyword },
    // { key: 'Name', type: '=', value: Name },
    // [
    //  'or',
    //  { key: 'Name', type: 'like', value: keyword },
    // ],
  ]
}
