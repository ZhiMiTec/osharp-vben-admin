<template>
  <BasicModal
    title="选择项目成员"
    width="800px"
    :keyboard="false"
    :footer="false"
    @register="registerModal"
    :afterClose="() => $emit('close')"
  >
    <BasicTable :max-height="47 * 8" @register="register">
      <template #toolbar>
        <a-button type="primary" @click="doAdd">添加</a-button>
      </template>
      <template #action="{ record }">
        <AButton
          type="primary"
          :disabled="list.findIndex((o) => o.DistributionMemberId == record.Id) >= 0"
          @click="doSubmit(record)"
          >添加</AButton
        >
      </template>
    </BasicTable>
  </BasicModal>
</template>

<script lang="ts" setup>
  import { onMounted, defineProps, ref, defineEmits, unref, toRaw, nextTick } from 'vue'
  import { BasicModal, useModal } from '/@/components/Modal'
  import { BasicTable, useTable } from '/@/components/Table'
  import { ActionConfig, Columns } from '../data/ProjectMemberTable'
  import { useMessage } from '../../../../hooks/web/useMessage'
  //
  const props = defineProps({
    members: { type: Array },
    list: { type: Array, default: () => [] },
  })
  const emit = defineEmits(['close', 'submit'])
  const { createWarningModal } = useMessage()

  const [registerModal, { openModal, closeModal }] = useModal()
  const [register, tableMethods] = useTable({
    api: getPageData,
    canResize: true,
    columns: Columns,
    actionColumn: ActionConfig,
    showTableSetting: true,
    clickToRowSelect: false,
    pagination: false,
    rowSelection: {
      type: 'checkbox',
      getCheckboxProps(item) {
        return {
          disabled: props.list.findIndex((o: Recordable) => o.DistributionMemberId == item.Id) >= 0,
        }
      },
    },
  })

  async function getPageData() {
    return {
      items: props.members,
      total: props.members?.length,
    }
  }

  onMounted(openModal)

  async function doSubmit(item) {
    emit('submit', [JSON.parse(JSON.stringify(item))])
    closeModal()
  }

  async function doAdd() {
    let items = tableMethods.getSelectRows()
    if (items.length <= 0) {
      createWarningModal({ content: '请选择一条数据' })
      return
    }
    emit('submit', JSON.parse(JSON.stringify(items)))
    closeModal()
  }
</script>

<style lang="less" scoped></style>
