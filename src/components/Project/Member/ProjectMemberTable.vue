<template>
  <view>
    <BasicTable ref="BasicTableRef" :max-height="!inner ? null : 47 * 5" @register="register">
      <template v-if="changeEnabled" #toolbar>
        <AButton type="primary" @click="toCreate">添加</AButton>
        <template v-if="!isCreateNow && !inner">
          <Divider type="vertical" />
          <AButton type="primary" @click="doSave">保存</AButton>
        </template>
      </template>
      <template v-if="changeEnabled" #drag>
        <div class="move-handler" style="">拖动排序</div>
      </template>
      <template #action="{ record, index }">
        <TableAction
          :actions="[
            {
              icon: 'clarity:note-edit-line',
              tooltip: '查看',
              auth: '.InfeedProjectInfo.ReadOne',
              onClick: toEdit.bind(null, record, index),
            },
            {
              icon: 'ant-design:delete-outlined',
              tooltip: '删除',
              color: 'error',
              auth: '.InfeedProjectInfo.Delete',
              popConfirm: {
                title: '是否确认删除',
                confirm: doDelete.bind(null, record, index),
              },
            },
          ]"
        />
      </template>
    </BasicTable>
    <ProjectMemberDetail
      v-if="detailPayload"
      :entityTable="entityTable"
      :payload="detailPayload"
      @submit="onDetailSubmit"
      @close="detailPayload = false"
    />
  </view>
</template>

<script lang="ts" setup>
  import { Divider } from 'ant-design-vue'
  import { BasicTable, useTable, TableAction } from '/@/components/Table'
  import { computed, nextTick, onMounted, onUpdated, Ref, ref, toRaw, unref, watch } from 'vue'
  import { Columns, ActionConfig } from './data/ProjectMemberTable'
  import ProjectMemberDetail from './modal/ProjectMemberDetail.vue'
  import { useMessage } from '../../../hooks/web/useMessage'
  import { cloneDeep } from 'lodash-es'

  // 拖拽专用的库
  import Sortable from 'sortablejs'

  const props = defineProps({
    inner: { type: Boolean },
    list: { type: Array },
    detail: { type: Object, default: () => ({}) },
    saveApi: { type: Function },
    entityTable: { type: String },
    changeEnabled: { type: Boolean, default: false },
  })
  defineExpose({
    beforeTabChange,
    afterTabChange,
  })
  const emits = defineEmits(['update:list', 'refresh', 'tableRefresh'])
  const isCreateNow = computed(() => props.detail && !props.detail.Id)
  const BasicTableRef = ref(null) as Ref<any>

  const newOriginMemberList = ref([])
  const memberList = computed({
    get() {
      return newOriginMemberList.value
    },
    set(value) {
      emits('update:list', value)
    },
  }) as any
  watch(
    () => memberList.value,
    () => {
      if (unref(initMemberList) === null) {
        initMemberList.value = cloneDeep(unref(memberList))
      }
    },
  )
  watch(
    () => props.list,
    () => {
      newOriginMemberList.value = (props.list || []).sort((a, b) => a.Sort - b.Sort)
    },
  )
  const initMemberList: any = ref([])
  const detailPayload = ref<any>(false)
  const detailIndex = ref<number>(-1)

  const { createErrorModal, createConfirm } = useMessage()

  onUpdated(() => {
    tableMethods.reload()
  })

  onMounted(async () => {
    console.log(props.list)
    await nextTick()
    rowDropInit()
  })

  async function beforeTabChange() {
    let hasChange = false
    if (unref(memberList).length !== unref(initMemberList).length) {
      hasChange = true
    } else if (JSON.stringify(unref(memberList)) !== JSON.stringify(unref(initMemberList))) {
      hasChange = true
    }
    if (!hasChange) {
      return true
    }
    return new Promise((resolve) => {
      createConfirm({
        iconType: 'warning',
        title: '提示',
        content: '当前页面数据未保存，离开后可能会丢失，是否确定离开？',
        onOk: async () => {
          emits('refresh')
          resolve({ pass: true, break: true })
        },
        onCancel: () => resolve(false),
      })
    })
  }

  async function afterTabChange() {
    initMemberList.value = cloneDeep(unref(memberList))
  }

  const [register, tableMethods] = useTable({
    api: getPageData,
    canResize: !props.inner,
    columns: Columns,
    actionColumn: ActionConfig,
    showTableSetting: true,
    clickToRowSelect: false,
    pagination: false,
    // rowSelection: { type: 'checkbox' },
  })

  async function getPageData() {
    emits('tableRefresh', cloneDeep(unref(memberList)))
    return {
      items: memberList.value,
      total: memberList.value.length,
    }
  }

  function toEdit(item, index) {
    detailPayload.value = toRaw(item)
    detailIndex.value = index
  }

  function doDelete(_, index) {
    unref(memberList).splice(index, 1)
    tableMethods.reload()
  }

  function onDetailSubmit(data) {
    const copyData = toRaw(data)
    if (!copyData.EntityId) {
      copyData.EntityId = props.detail.Id
    }
    if (!copyData.EntityTable) {
      copyData.EntityTable = props.detail.EntityTable
    }
    const teacherExist =
      copyData.TeacherId &&
      unref(memberList).findIndex((item) => item.TeacherId === copyData.TeacherId) !== -1
    if (teacherExist) {
      if (unref(detailPayload).TeacherId !== copyData.TeacherId) {
        createErrorModal({ title: '错误', content: '该教师已存在' })
        return
      }
    }
    console.log(unref(detailIndex))
    if (unref(detailIndex) == -1) {
      unref(memberList).push(copyData)
    } else {
      unref(memberList).splice(unref(detailIndex), 1, copyData)
    }
    tableMethods.reload()
  }

  function toCreate() {
    detailIndex.value = -1
    detailPayload.value = {}
  }

  function doSave() {
    let copyInitMemberList = JSON.parse(JSON.stringify(initMemberList.value))
    initMemberList.value = null
    let copySubmitVal = JSON.parse(JSON.stringify(memberList.value))
    copySubmitVal.map((o, oi) => (o.Sort = oi + 1))
    ;(props as any).saveApi(copySubmitVal)
  }

  function rowDropInit() {
    if (!unref(BasicTableRef)?.$el) {
      setTimeout(rowDropInit, 1000)
      return
    }
    const refEl = unref(BasicTableRef).$el
    const tbody = refEl.querySelector('.ant-table-body tbody')
    Sortable.create(tbody, {
      handle: '.move-handler',
      async onEnd({ newIndex, oldIndex }) {
        newIndex--
        oldIndex--
        const dgEl = refEl.querySelector('[draggable]')
        dgEl.remove()
        await nextTick()
        const currRow = unref(memberList).splice(oldIndex, 1)[0]
        unref(memberList).splice(newIndex, 0, currRow)
        unref(memberList).map((item, index) => {
          item.Sort = index + 1
        })
        tableMethods.reload()
      },
    })
  }
</script>

<style lang="less" scoped>
  .move-handler {
    height: 32px;
    line-height: 32px;
    text-align: center;
    border: 1px dashed #5f9ea0;
    cursor: move;
    border-radius: 5px;
    background-color: #fff;
    user-select: none;
  }
</style>
