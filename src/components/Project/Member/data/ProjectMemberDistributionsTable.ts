import { BasicColumn, FormProps } from '../../../Table'
import {
  createBooleanColumn,
  createBooleanTextColumn, createHolderProps,
  createRequireFormRule,
} from '../../../../utils/osharp'
import { GetDataDict } from '../../../../api/Common/DataDict'
import { useDataDictApiSelect } from "../../../../utils/candoo/apiSelectHooks";
import { useTeacherPicker } from "../../../../utils/candoo/pickerHooks";
import { set } from "lodash-es";

export const Columns: BasicColumn[] = [
  {
    title: '成员类别',
    dataIndex: 'FromName',
    width: 100,
    customRender: ({ record }) => record.MemberInfo.FromName,
  },
  {
    title: '姓名',
    dataIndex: 'Name',
    width: 100,
    ellipsis: true,
    customRender: ({ record }) => record.MemberInfo.Name,
  },
  {
    title: '性别',
    dataIndex: 'SexName',
    width: 100,
    customRender: ({ record }) => record.MemberInfo.SexName,
  },
  {
    title: '所属单位',
    dataIndex: 'FromUnit',
    ellipsis: true,
    customRender: ({ record }) => record.MemberInfo.FromUnit,
  },
  {
    title: '负责人',
    dataIndex: 'IsAuthor',
    width: 100,
    customRender: ({ record }) => createBooleanTextColumn(record.MemberInfo.IsAuthor),
  },
  {
    title: '教师',
    dataIndex: 'TeacherId',
    width: 100,
    customRender: ({ record }) => createBooleanTextColumn(!!record.MemberInfo.TeacherId),
  },
  // {
  //   title: '证件类型',
  //   dataIndex: 'IdCardTypeName',
  //   width: 100,
  // },
  // {
  //   title: '身份证',
  //   dataIndex: 'IdCard',
  //   width: 100,
  // },
  // {
  //   title: '学生角色',
  //   dataIndex: 'StudentTypeName',
  //   width: 100,
  // },
  // {
  //   title: '港澳台侨外码',
  //   dataIndex: 'AlienCode',
  //   width: 100,
  // },
  // {
  //   title: '科研安-政治面貌',
  //   dataIndex: 'KYA_PoliticsFaceName',
  //   width: 100,
  // },
  // {
  //   title: '科研安-职称等级',
  //   dataIndex: 'KYA_AcademicCodeName',
  //   width: 100,
  // },
  // {
  //   title: '科研安-学历',
  //   dataIndex: 'KYA_EducationName',
  //   width: 100,
  // },
  // {
  //   title: '开户行名称',
  //   dataIndex: 'OpenBank',
  //   width: 100,
  // },
  // {
  //   title: '银行账号',
  //   dataIndex: 'BankCode',
  //   width: 100,
  // },
  // {
  //   title: '持卡人',
  //   dataIndex: 'OwnCardPerson',
  //   width: 100,
  // },
  // {
  //   title: '手机号码',
  //   dataIndex: 'Phone',
  //   width: 100,
  // },
  {
    title: '业绩分',
    dataIndex: 'Score',
    width: 100,
    fixed: 'right',
    slots: { customRender: 'score' },
  },
  {
    title: '奖金金额',
    dataIndex: 'Money',
    width: 100,
    fixed: 'right',
    slots: { customRender: 'money' },
  },
]

export const ActionConfig: BasicColumn = {
  title: '',
  dataIndex: '_action',
  width: 120,
  slots: { customRender: 'action' },
  fixed: 'right',
}

export const DetailFormConfig: FormProps = {
  labelWidth: 100,
  showActionButtonGroup: false,
  schemas: [
    {
      field: 'FromId',
      label: '来源',
      colProps: { span: 24 },
      defaultValue: '541',
      rules: [],
      ...useDataDictApiSelect('FromEnum', '来源', ({ formModel }) => {
        return {
          onChange(_, item) {
            set(formModel, 'FromName', item.label)
            if (item.value != 541) {
              set(formModel, 'TeacherId', '')
            } else {
              set(formModel, 'StudentTypeId', '')
            }
          },
        }
      }),
    },
    {
      field: 'TeacherId',
      label: '教师绑定',
      colProps: { span: 24 },
      defaultValue: '',
      rules: [],
      ifShow: ({ values }) => values.FromId == 541,
      ...useTeacherPicker(({ formModel }) => {
        return {
          onChange: (v) => set(formModel, 'TeacherId', v),
          onRowClick: (v) => {
            set(formModel, 'SexId', v.SexId)
            set(formModel, 'Name', v.Name)
            set(formModel, 'FromUnit', v.DepartmentName)
          },
        }
      }),
    },
    createHolderProps('TeacherId', '', () => ({
      ifShow: ({ values }) => values.FromId != 541,
    })),
    {
      field: 'Name',
      label: '姓名',
      colProps: { span: 12 },
      component: 'Input',
      defaultValue: '',
      rules: [createRequireFormRule()],
      componentProps({ formModel }) {
        return {
          readonly: formModel.FromId == 541,
        }
      },
    },
    {
      field: 'SexId',
      label: '性别',
      colProps: { span: 12 },
      defaultValue: null,
      rules: [createRequireFormRule()],
      ...useDataDictApiSelect('SexEnum', '性别', ({ formModel }) => {
        return {
          readonly: formModel.FromId == 541,
          disabledValues: ['23'],
        }
      }),
    },
    {
      field: 'FromUnit',
      label: '所属单位',
      colProps: { span: 24 },
      component: 'Input',
      defaultValue: '',
      rules: [],
    },
    {
      field: 'StudentTypeId',
      label: '学生角色',
      colProps: { span: 24 },
      defaultValue: null,
      rules: [],
      ifShow: ({ values }) => values.FromId == 543,
      ...useDataDictApiSelect('StudentTypeEnum', '学生角色'),
    },
    {
      field: 'IdCardTypeId',
      label: '证件类型',
      colProps: { span: 12 },
      defaultValue: '361',
      rules: [],
      ...useDataDictApiSelect('IdCardTypeEnum', '证件类型'),
    },
    {
      field: 'IdCard',
      label: '身份证',
      colProps: { span: 12 },
      component: 'Input',
      defaultValue: '',
      ifShow: ({ values }) => values.IdCardTypeId == 361,
      rules: [],
    },
    {
      field: 'AlienCode',
      label: '港澳台侨外码',
      colProps: { span: 12 },
      component: 'Input',
      defaultValue: '',
      ifShow: ({ values }) => values.IdCardTypeId != 361,
      rules: [],
    },
    {
      field: 'KYA_PoliticsFaceId',
      label: '政治面貌',
      colProps: { span: 8 },
      defaultValue: null,
      rules: [],
      ...useDataDictApiSelect('KYA_PoliticsFaceEnum', '政治面貌'),
    },
    {
      field: 'KYA_AcademicCodeId',
      label: '职称等级',
      colProps: { span: 8 },
      defaultValue: null,
      rules: [],
      ...useDataDictApiSelect('KYA_AcademicCodeEnum', '职称等级'),
    },
    {
      field: 'KYA_EducationId',
      label: '学历',
      colProps: { span: 8 },
      defaultValue: null,
      rules: [],
      ...useDataDictApiSelect('KYA_EducationEnum', '学历'),
    },
    {
      field: 'ResearchArea',
      label: '研究方向',
      component: 'Input',
      colProps: { span: 12 },
      defaultValue: '',
      dynamicRules: ({ values }) => (values.FromId == '541' ? [createRequireFormRule()] : []),
    },
    {
      field: 'DegreeId',
      label: '学位',
      colProps: { span: 12 },
      defaultValue: '',
      dynamicRules: ({ values }) => (values.FromId == '541' ? [createRequireFormRule()] : []),
      ...useDataDictApiSelect('DegreeEnum', '学历'),
    },
    {
      field: 'OpenBank',
      label: '开户行',
      colProps: { span: 12 },
      component: 'Input',
      defaultValue: '',
      rules: [],
    },
    {
      field: 'BankCode',
      label: '银行账号',
      colProps: { span: 12 },
      component: 'Input',
      defaultValue: '',
      rules: [],
    },
    {
      field: 'OwnCardPerson',
      label: '持卡人',
      colProps: { span: 12 },
      component: 'Input',
      defaultValue: '',
      rules: [],
    },
    {
      field: 'Phone',
      label: '手机号码',
      colProps: { span: 12 },
      component: 'Input',
      defaultValue: '',
      rules: [],
    },
  ],
}
