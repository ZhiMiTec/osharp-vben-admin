<template>
  <Popover v-model:visible="visible" trigger="click" overlayClassName="data-dict-picker-popover">
    <AInput
      :value="labelText"
      :placeholder="`${placeholder}`"
      :disabled="disabled"
      allow-clear
      @update:value="onInputValueUpdate"
    />
    <template #content>
      <div :style="{ width: width + 'px' }">
        <div class="p-5px flex">
          <AInput
            v-model:value="keyword"
            allow-clear
            placeholder="请输入关键词"
            @keypress.enter.stop="noop"
          />
        </div>
        <div
          :style="{
            maxHeight: 47 * (maxShowItems + 2) + 'px',
            minHeight: 47 * maxShowItems + 'px',
          }"
          style="overflow: hidden; user-select: none"
        >
          <BasicTable
            :maxHeight="47 * maxShowItems"
            @register="register"
            @row-click="onRowClick"
            @selection-change="onSelectionChange"
          />
        </div>
      </div>
    </template>
  </Popover>
</template>
<script lang="ts" setup>
  import { Popover, Input, Select as ASelect } from 'ant-design-vue'
  import { nextTick, onMounted, ref, unref, watch } from 'vue'
  import { BasicColumn, BasicTable, useTable } from '/@/components/Table'
  import { cloneDeep, get, noop } from 'lodash-es'
  import { listToTree } from '../../../utils/helper/treeHelper'
  import { createBooleanColumn } from '../../../utils/osharp'
  const props = defineProps({
    name: { type: String },
    api: { type: Function, default: () => [] },
    multiple: { type: Boolean, default: false },
    maxShowItems: { type: Number, default: 8 },
    value: {},
    labelTemplate: { type: String, default: '[#Code#]#Name#' },
    width: { type: Number, default: 800 },
    placeholder: { type: String, default: '请选择' },
    defaultExpandAll: { type: Boolean, default: true },
    colHook: { type: Function, default: (o) => o },
    leafOnly: { type: Boolean, default: true },
    //
    labelApi: { type: Function, default: () => [] },
    valueField: { type: String, default: 'Id' },
    labelField: { type: String, default: 'Name' },
    disabled: { type: Boolean, default: false },
  })
  const labelText = ref('')
  const valueText = ref('')
  let dicts = []
  let sourceDicts = []
  watch(
    () => props.value,
    async () => {
      if (!dicts.length) {
        await getPageData()
      }
      updateLabelText()
    },
    { immediate: true },
  )
  const emits = defineEmits(['change'])
  const visible = ref(false)
  const keyword = ref('')
  const [register, tableMethods] = useTable({
    api: getPageData,
    canResize: true,
    columns: [],
    showTableSetting: false,
    pagination: false,
    isTreeTable: true,
    showIndexColumn: false,
    defaultExpandAllRows: props.defaultExpandAll,
    expandRowByClick: false,
    rowKey: 'Id',
    ...(props.multiple
      ? {
          rowSelection: {
            type: 'checkbox',
            getCheckboxProps(item) {
              return {
                disabled: !item.Enable,
              }
            },
          },
        }
      : {}),
    clickToRowSelect: false, //props.multiple,
  })
  watch(
    () => visible.value,
    () => {
      if (visible.value) {
        tableMethods.reload()
      }
    },
  )
  watch(
    () => [keyword.value],
    () => {
      if (visible.value) {
        tableMethods.reload()
      }
    },
  )
  onMounted(() => {
    if (props.value) {
      getPageData()
    }
  })

  async function getPageData() {
    try {
      const { api, name } = props
      let res = await api({ key: name })
      let { Data } = res
      let { DataDicts, ...DataDictConf } = Data
      DataDicts = DataDicts.map((o) => {
        if (typeof o.ExtraData === 'string') {
          try {
            o.ExtraData = JSON.parse(o.ExtraData || '{}')
          } catch (e) {
            o.ExtraData = JSON.parse(JSON.stringify(o.ExtraData || '{}'))
          }
        }
        return o
      })
      sourceDicts = cloneDeep(DataDicts)
      dicts = cloneDeep(DataDicts)
      dicts = dicts.filter(
        (o: any) => o.Name.includes(keyword.value) || o.Code.includes(keyword.value),
      )
      const treeMap = listToTree(dicts, {
        id: 'Id',
        pid: 'ParentId',
        children: 'children',
        ignoreEmptyClient: true,
      })
      if (unref(visible)) {
        syncTableColumns(JSON.parse(Data.ExtendInfo || '[]'))
        setTimeout(() => {
          if (props.defaultExpandAll) {
            tableMethods.expandAll()
          }
          if (props.multiple && props.value) {
            tableMethods.setSelectedRowKeys(props.value as any)
          }
        }, 200)
      }
      await updateLabelText()
      return { items: treeMap, total: treeMap.length }
    } catch (e) {
      return { items: [], total: 0 }
    }
  }

  function onRowClick(e: any) {
    const currentValue = get(e, 'Id')
    if (props.leafOnly && e?.children?.length) {
      // 这里的话就是只能选择节点，所以点击的话我们需要去展开一下这一层
      tableMethods.toggleRowExpanded(currentValue)
      return
    }
    if (props.multiple) {
      if (!e.Enable) {
        return
      }
      let values = tableMethods.getSelectRows().map((o) => o.Id)
      if (values.indexOf(currentValue) <= -1) {
        values.push(currentValue)
      } else {
        values = values.filter((o) => o !== currentValue)
      }
      tableMethods.setSelectedRowKeys(values)
      emits('change', values, dicts)
    } else {
      const { name } = props
      emits('change', currentValue, dicts, e)
      visible.value = false
    }
  }

  // TODO:暂时废弃这个函数
  function onSelectionChange() {
    let values = tableMethods.getSelectRows().map((o) => o.Id)
    if (props.multiple && dicts.length) {
      emits('change', values, dicts)
    }
  }

  function formatLabelText(value) {
    const item: any = sourceDicts.find((o: any) => o.Id === value)
    let copyText = props.labelTemplate + ''
    const matches = copyText.match(/\#(.*?)\#/gi) || []
    matches.map((o) => {
      const key = o.replace(/#/gi, '')
      let value = get(item, key)
      if (value === undefined || value === null) {
        value = get(item, 'ExtraData.' + key)
      }
      if (value === undefined || value === null) {
        value = ''
      }
      copyText = copyText.replace(o, value)
    })
    if (!copyText) {
      copyText = item?.Name
    }
    return copyText
  }

  // old
  async function updateLabelText() {
    const { value } = props as any
    if (!value || value.length == 0) {
      labelText.value = ''
      return
    }
    const labelArr = [].concat(value).map((o) => {
      const label = formatLabelText(o)
      return label
    })
    labelText.value = labelArr.join(',')
    return
  }

  function syncTableColumns(options: any[]) {
    try {
      let columns: BasicColumn[] = [
        {
          title: '编号',
          dataIndex: 'Code',
          align: 'left',
          width: 120,
        },
        {
          title: '名称',
          dataIndex: 'Name',
          width: 'auto',
          align: 'left',
        },
      ]
      options.map((o) => {
        columns.push({
          title: o.label,
          dataIndex: `ExtraData.${o.key}`,
          customRender: ({ record }) => {
            if (o.type === 'boolean') {
              return createBooleanColumn(record.ExtraData[o.key])
            } else {
              return record.ExtraData[o.key]
            }
          },
          width: 100,
        })
      })
      columns = props.colHook(columns) as BasicColumn[]
      tableMethods.setColumns(columns)
    } catch (e) {
      console.error(e)
    }
  }

  function onInputValueUpdate(v) {
    if (!v) {
      tableMethods.clearSelectedRowKeys()
      if (props.multiple) {
        emits('change', [], dicts)
      } else {
        emits('change', '', dicts)
      }
    }
  }
</script>

<style lang="less">
  .data-dict-picker-popover {
    .ant-popover-inner-content {
      padding: 0;
    }
  }
</style>
