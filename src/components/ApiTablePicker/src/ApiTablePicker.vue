<template>
  <Popover v-model:visible="visible" trigger="click" overlayClassName="api-table-picker-popover">
    <AInput
      :value="labelText"
      :placeholder="placeholder"
      :disabled="disabled"
      allow-clear
      @update:value="onInputValueUpdate"
    />
    <template #content>
      <div :style="{ width: width + 'px' }" @keypress.enter.stop="noop">
        <BasicTable :maxHeight="47 * 6" @register="register" @row-click="onRowClick" />
      </div>
    </template>
  </Popover>
</template>
<script lang="ts" setup>
  import { Popover } from 'ant-design-vue'
  import { ref, unref, watch } from 'vue'
  import { BasicTable, useTable } from '/@/components/Table'
  import { makeOSharpPage } from '../../../utils/osharp'
  import { OSharpPageOption } from '../../../utils/osharp/types/page'
  import { get, noop } from 'lodash-es'
  const labelText = ref('')
  const valueText = ref('')
  const props = defineProps({
    api: { type: Function, default: () => [] },
    labelApi: { type: Function, default: () => [] },
    labelTemplate: { type: String, default: '' },
    showSearch: { type: Boolean },
    getFilterItems: { type: Function, default: () => [] },
    valueField: { type: String, default: 'Id' },
    labelField: { type: String, default: 'Name' },
    width: { type: Number, default: 800 },
    formConfig: { default: () => ({}) },
    columns: {},
    value: {},
    multiple: { type: Boolean, default: false },
    placeholder: { type: String, default: '请选择' },
    //
    disabled: { type: Boolean, default: false },
  })
  watch(
    () => [props.value, props.labelTemplate],
    () => updateLabelText(),
  )
  const emits = defineEmits(['change', 'rowClick'])
  const visible = ref(false)
  const [register, tableMethods] = useTable({
    api: getPageData,
    canResize: true,
    useSearchForm: props.showSearch,
    columns: props.columns as any,
    formConfig: props.formConfig as any,
    // actionColumn: {},
    showTableSetting: false,
    clickToRowSelect: props.multiple,
    pagination: { showSizeChanger: false },
    rowSelection: props.multiple ? { type: 'checkbox' } : undefined,
  })

  async function getPageData({ page, pageSize }) {
    const searchForm = tableMethods.getForm().getFieldsValue()
    const body = makeOSharpPage({
      pageIndex: page,
      pageSize,
      sort: { key: 'Id', type: 'up' },
      filter: props.getFilterItems(searchForm),
    } as OSharpPageOption)
    const {
      Data: { Rows, Total },
    } = await props.api(body)
    return { items: Rows, total: Total }
  }

  function onRowClick(e: any) {
    const { valueField, labelField } = props
    const currentValue = get(e, valueField as string)
    const currentLabel = getItemRenderText(e)
    if (props.multiple) {
      const valueArr = unref(valueText)
        .split(',')
        .filter((o) => o)
      const labelArr = unref(labelText)
        .split(',')
        .filter((o) => o)
      if (valueArr.indexOf(currentValue) > -1) {
        valueArr.splice(valueArr.indexOf(currentValue), 1)
        labelArr.splice(labelArr.indexOf(currentLabel), 1)
      } else {
        valueArr.push(currentValue)
        labelArr.push(currentLabel)
      }
      labelText.value = labelArr.join(',')
      valueText.value = valueArr.join(',')
      emits('change', valueArr)
      emits('rowClick', e)
    } else {
      emits('change', currentValue)
      emits('rowClick', e)
      labelText.value = getItemRenderText(e)
      valueText.value = currentValue
      visible.value = false
    }
  }

  function getItemRenderText(o) {
    const { labelField, labelTemplate } = props
    let label = get(o, labelField as any)
    if (labelTemplate) {
      let item = o
      let copyText = labelTemplate + ''
      const matches = copyText.match(/\#(.*?)\#/gi) || []
      matches.map((i) => {
        const key = i.replace(/#/gi, '')
        let value = get(item, key)
        if (value === undefined || value === null) {
          value = get(item, 'ExtraData.' + key)
        }
        if (value === undefined || value === null) {
          value = ''
        }
        copyText = copyText.replace(i, value)
      })
      if (copyText) {
        label = copyText
      }
    }
    return label
  }

  async function updateLabelText() {
    const { value, labelApi, labelField, valueField, labelTemplate } = props
    if (value == unref(valueText) && labelText) {
      return
    }
    if (!value || value.length == 0) {
      labelText.value = ''
      return
    }
    if (!labelApi) {
      labelText.value = [].concat(value as any).join(',')
      return
    }
    const { Data } = await labelApi([].concat(value as any))
    const labelArr = Data.map((o) => {
      let label = getItemRenderText(o)
      const valueKey = get(o, valueField as any)
      return label || valueKey || JSON.stringify(o)
    })
    labelText.value = labelArr.join(',')
    return
  }

  function onInputValueUpdate(v) {
    if (!v) {
      tableMethods.clearSelectedRowKeys()
      if (props.multiple) {
        emits('change', [])
      } else {
        emits('change', '')
      }
    }
  }
</script>

<style lang="less">
  .api-table-picker-popover {
    .ant-popover-inner-content {
      padding: 0;
    }
    .vben-basic-table-form-container {
      padding: 0;
      & > .ant-form {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
      }
    }
  }
</style>
