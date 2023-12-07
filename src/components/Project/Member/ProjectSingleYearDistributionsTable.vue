<template>
  <view>
    <BasicTable ref="BasicTableRef" :max-height="!inner ? null : 47 * 5" @register="register">
      <template #toolbar>
        <AButton
          v-if="detail?.Id ? detail.RewardFlowPower.DistributionMember : true"
          type="primary"
          @click="toCreate"
          >添加</AButton
        >
        <template
          v-if="detail?.Id ? detail.RewardFlowPower.DistributionChange : !isCreateNow && !inner"
        >
          <Divider type="vertical" />
          <AButton type="primary" @click="doSave">保存</AButton>
        </template>
      </template>
      <template #drag>
        <div class="move-handler" style="">拖动排序</div>
      </template>
      <template #action="{ record, index }">
        <TableAction
          :actions="[
            {
              icon: 'clarity:note-edit-line',
              tooltip: '查看',
              onClick: toEdit.bind(null, record, index),
            },
            {
              icon: 'ant-design:delete-outlined',
              tooltip: '删除',
              color: 'error',
              ifShow: detail?.Id ? detail.RewardFlowPower.DistributionMember : true,
              popConfirm: {
                title: '是否确认删除',
                confirm: doDelete.bind(null, record, index),
              },
            },
          ]"
        />
      </template>
      <template #score="{ index, record }">
        <AInput
          v-if="record.TeacherId"
          :value="getIndexData(distributionList, index, 'Score')"
          @input="setIndexData(distributionList, index, 'Score', $event.target.value)"
        />
      </template>
      <template #money="{ index, record }">
        <AInput
          v-if="detail && detail.ThisYear > 2019 && detail.ThisYear < 2022 && record.TeacherId"
          :value="getIndexData(distributionList, index, 'Money')"
          @input="setIndexData(distributionList, index, 'Money', $event.target.value)"
        />
      </template>
    </BasicTable>
    <ProjectMemberDetail
      v-if="detailPayload"
      :payload="detailPayload"
      @submit="onDetailSubmit"
      :entity-table="entityTable"
      @close="detailPayload = false"
    />
  </view>
</template>

<script lang="ts" setup>
  import { Divider } from 'ant-design-vue'
  import { BasicTable, useTable, TableAction } from '/@/components/Table'
  import { computed, nextTick, onMounted, onUpdated, Ref, ref, toRaw, unref, watch } from 'vue'
  import { Columns, ActionConfig } from './data/ProjectSingleYearMemberTable'
  import ProjectMemberDetail from './modal/ProjectMemberDetail.vue'
  import { useMessage } from '../../../hooks/web/useMessage'
  import { cloneDeep } from 'lodash-es'
  import Sortable from 'sortablejs'

  const props = defineProps({
    inner: { type: Boolean },
    entityTable: { type: String },
    detail: { type: Object, default: () => ({}) },
    saveApi: { type: Function },
  })
  defineExpose({
    beforeTabChange,
    afterTabChange,
  })
  const emits = defineEmits(['update:list', 'refresh'])
  const isCreateNow = computed(() => props.detail && !props.detail.Id)

  const memberList = ref([])
  const distributionList = ref([])
  const BasicTableRef = ref(null) as Ref<any>
  watch(
    () => props.detail,
    () => {
      if (unref(props.detail).DistributionMemberList) {
        memberList.value = cloneDeep(unref(props.detail).DistributionMemberList).sort((a, b) => {
          return a.Sort - b.Sort
        })
      }
      if (unref(props.detail).DistributionList) {
        distributionList.value = cloneDeep(unref(props.detail).DistributionList).sort((a, b) => {
          return a.Sort - b.Sort
        })
      }
    },
    { immediate: true },
  )
  onMounted(async () => {
    await nextTick()
    rowDropInit()
  })

  const initMemberList: any = ref([])
  const detailPayload = ref<any>(false)
  const detailIndex = ref<number>(-1)

  const { createErrorModal, createConfirm } = useMessage()

  onUpdated(() => {
    tableMethods.reload()
  })

  async function beforeTabChange() {
    let hasChange = false
    let sortedDetailMembers = props.detail.DistributionMemberList.sort((a, b) => {
      return a.Sort - b.Sort
    })
    if (unref(memberList).length !== props.detail.DistributionMemberList.length) {
      hasChange = true
    } else if (JSON.stringify(unref(memberList)) !== JSON.stringify(sortedDetailMembers)) {
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
    if (unref(props.detail).DistributionMemberList) {
      memberList.value = cloneDeep(unref(props.detail).DistributionMemberList).sort((a, b) => {
        return a.Sort - b.Sort
      })
    }
    if (unref(props.detail).DistributionList) {
      distributionList.value = cloneDeep(unref(props.detail).DistributionList).sort((a, b) => {
        return a.Sort - b.Sort
      })
    }
  }

  const [register, tableMethods] = useTable({
    api: getPageData,
    canResize: true,
    columns: (() => {
      let copyColumns = cloneDeep(Columns)
      if (props.entityTable != 'Thesis') {
        copyColumns = copyColumns.filter((o) => o.dataIndex != 'IsAuthor')
      }
      return copyColumns
    })(),
    actionColumn: ActionConfig,
    showTableSetting: true,
    clickToRowSelect: false,
    pagination: false,
    // rowSelection: { type: 'checkbox' },
  })

  async function getPageData() {
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
    unref(distributionList).splice(index, 1)
    tableMethods.reload()
  }

  function onDetailSubmit(data) {
    const copyData = cloneDeep(unref(data))
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
    if (unref(detailIndex) == -1) {
      unref(memberList).push(copyData)
      unref(distributionList).push({
        Id: 0,
        EntityTable: copyData.EntityTable,
        EntityId: copyData.EntityId,
        ParentId: 0,
        DistributionMemberId: 0,
        TeacherId: copyData.TeacherId,
        ThisYear: props.detail.ThisYear,
        Score: 0,
        Money: 0,
        Sort: unref(distributionList).length,
        SortStr: unref(distributionList).length + '',
        ChangeInfo: '',
      })
    } else {
      unref(memberList).splice(unref(detailIndex), 1, copyData)
      if (copyData.TeacherId != unref(distributionList)[unref(detailIndex)].TeacherId) {
        const distributionItem = unref(distributionList)[unref(detailIndex)]
        distributionItem.TeacherId = copyData.TeacherId
        unref(distributionList).splice(unref(detailIndex), 1, distributionItem)
      }
    }
    tableMethods.reload()
  }

  function toCreate() {
    detailIndex.value = -1
    detailPayload.value = {}
  }

  function doSave() {
    initMemberList.value = null
    ;(props as any).saveApi(memberList.value, distributionList.value)
  }

  function getIndexData(list, index, key) {
    try {
      return list[index][key]
    } catch (e) {
      return ''
    }
  }

  function setIndexData(list, index, key, value) {
    try {
      list[index][key] = value
    } catch (e) {
      // nothing
    }
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
        let currRow = unref(memberList).splice(oldIndex, 1)[0]
        unref(memberList).splice(newIndex, 0, currRow)
        unref(memberList).map((item, index) => {
          item.Sort = index + 1
        })
        currRow = unref(distributionList).splice(oldIndex, 1)[0]
        unref(distributionList).splice(newIndex, 0, currRow)
        unref(distributionList).map((item, index) => {
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
