import { FormSchema, Rule } from '../../components/Form';
import { createVNode } from 'vue';
import { BasicTable } from '../../components/Table';
import { isNull } from '../is';
import { GetDataDict } from '../../api/Common/DataDict';
import { UploadFiles } from '../../api/admin/OSSUpload';
import {debounce} from 'lodash-es'

export function createRequireFormRule(message: String = '该项目不能为空') {
  const checker = debounce(function (resolve,reject,value, rule) {
    const msg = rule.message;
    if (value === undefined || isNull(value)) {
      // 空值
      return reject(msg);
    } else if (Array.isArray(value) && value.length === 0) {
      // 数组类型
      return reject(msg);
    } else if (typeof value === 'string' && value.trim() === '') {
      // 空字符串
      return reject(msg);
    } else if (
      typeof value === 'object' &&
      Reflect.has(value, 'checked') &&
      Reflect.has(value, 'halfChecked') &&
      Array.isArray(value.checked) &&
      Array.isArray(value.halfChecked) &&
      value.checked.length === 0 &&
      value.halfChecked.length === 0
    ) {
      // 非关联选择的tree组件
      return reject(msg);
    }
    return resolve();
  }, 200)
  return {
    required: true,
    message,
    validator(rule: any, value: any) {
      return new Promise((resolve,reject) => {
        checker(resolve, reject, value, rule)
      })
    },
  } as Rule & any;
}

export function createCustomFormRule(callback: Function) {
  return {
    validator: callback,
  };
}

export function createTableFormCol(list, props) {
  let VNode = createVNode(BasicTable, {
    dataSource: list,
    ...props,
  });
  setTimeout(() => {
    // @ts-ignore
    VNode = null;
  }, 1);
  return VNode;
}

export function createHolderProps(field, defaultValue: any = '', propsMake?) {
  return {
    field,
    label: '',
    component: 'Input',
    defaultValue,
    colProps: {
      span: 0,
    },
    componentProps(actions) {
      return {
        ...(propsMake ? propsMake(actions) : {}),
      };
    },
  } as FormSchema;
}

export function createHolderCol(span = 0) {
  return {
    field: '_',
    label: '',
    component: 'Input',
    defaultValue: undefined,
    colProps: { span },
    renderColContent: () => '',
  } as FormSchema;
}

export function createUploadFormColProps(
  total = 2,
  size = Infinity,
  type: string[] = [],
  afterUpload?,
) {
  return {
    maxNumber: total,
    maxSize: size,
    accept: type,
    async api({ file }) {
      // @ts-ignore
      // TODO 这里需要实现上传逻辑
      const { FilePath, ...Data } = await UploadFiles(file);
      afterUpload && afterUpload({ FilePath, ...Data });
      return createUploadResponse(FilePath, { ...Data, FilePath });
    },
  };
}

export function createUploadResponse(url = '', payload = {}) {
  return {
    data: {
      url,
      ...payload,
    },
  };
}
