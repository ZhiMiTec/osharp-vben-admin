<template>
  <div>
    <BasicTable :maxHeight="maxHeight" @register="register">
      <template v-if="!hideSave" #toolbar>
        <div class="flex-1 flex">
          当前可分配业绩分 <span class="text-red-500 font-bold pl-[10px]">{{ detail.Score }}</span>， 已分配 <span class="text-red-500 font-bold pl-[10px]">{{ getTotalScore }}</span>
        </div>
        <AButton type="primary" :disabled="distributions.length == members.length" @click="toCreate"
          >添加({{ distributions.length }}/{{ members.length }})</AButton
        >
        <template v-if="!hideSave">
          <Divider type="vertical" />
          <AButton type="primary" @click="doSave">保存</AButton>
        </template>
      </template>
      <template #action="{ record, index }">
        <TableAction
          v-if="!hideSave"
          :actions="[
            {
              icon: 'ant-design:delete-outlined',
              tooltip: '删除',
              color: 'error',
              popConfirm: {
                title: '是否确认删除',
                confirm: doDelete.bind(null, record, index),
              },
            },
          ]"
        />
      </template>
      <template #score="{ index }">
        <AInput
          v-if="
            (distributions[index].MemberInfo && distributions[index].MemberInfo['FromName'] != '校外人员') &&
            (distributions[index].MemberInfo && distributions[index].MemberInfo['FromName'] != '校内学生')
          "
          :value="getIndexData(distributions, index, 'Score')"
          @input="setIndexData(distributions, index, 'Score', $event.target.value)"
        />
      </template>
      <template #money="{ index }">
        <AInput
          v-if="
            (detail && detail.ThisYear > 2019 && detail.ThisYear < 2022) &&
            (distributions[index].MemberInfo && distributions[index].MemberInfo['FromName'] != '校外人员') &&
            (distributions[index].MemberInfo && distributions[index].MemberInfo['FromName'] != '校内学生')
          "
          :value="getIndexData(distributions, index, 'Money')"
          @input="setIndexData(distributions, index, 'Money', $event.target.value)"
        />
      </template>
    </BasicTable>
    <ProjectMemberDistributionsAdd
      v-if="detailPayload"
      :members="members"
      :list="distributions"
      @submit="onDetailSubmit"
      @close="detailPayload = false"
    />
  </div>
</template>

<script lang="ts" setup>
  import { Divider, Alert } from 'ant-design-vue'
  import { BasicTable, useTable, TableAction } from '/@/components/Table'
  import { computed, onUpdated, ref, toRaw, unref, watch } from 'vue'
  import { Columns, ActionConfig } from './data/ProjectMemberDistributionsTable'
  import ProjectMemberDistributionsAdd from './modal/ProjectMemberDistributionsAdd.vue'
  import { useMessage } from '../../../hooks/web/useMessage'
  import { cloneDeep } from 'lodash-es'

  const props = defineProps({
    maxHeight: { default: null },
    thisYear: {},
    entityTable: { type: String },
    entityId: { type: [String, Number] },
    list: { type: Array },
    members: { type: Array },
    detail: { type: Object, default: () => ({}) },
    saveApi: { type: Function },
    hideSave: { type: Boolean, default: false },
    canResize: { type: Boolean, default: true },
  })
  defineExpose({
    beforeTabChange,
    afterTabChange,
    getTableData,
  })
  const emits = defineEmits(['update:list', 'refresh'])
  const { createConfirm } = useMessage()

  const distributions = computed({
    get() {
      const newList = []
      const newMemberList = (props.members || []).sort((a, b) => {
        return a.Sort - b.Sort
      })
      console.log(newMemberList.map(o => o.Name))
      newMemberList.map(o => {
        const listItem = props.list.find(p => p.DistributionMemberId == o.Id)
        if (listItem) {
          newList.push(listItem)
        }
      })
      console.log(newList)
      return newList
    },
    set(value) {
      emits('update:list', value)
    },
  }) as any
  const initDistributions: any = ref([])
  const detailPayload = ref<any>(false)
  watch(
    () => distributions.value,
    () => {
      if (initDistributions.value === null) {
        initDistributions.value = cloneDeep(unref(distributions))
      }
    },
  )
  const getTotalScore = computed(
    () => {
      let total = 0
      unref(distributions).map(o => {
        total += o.Score * 1
      })
      return total
    }
  )

  onUpdated(() => {
    tableMethods.reload()
  })

  async function beforeTabChange() {
    let hasChange = false
    if (unref(distributions).length !== unref(initDistributions).length) {
      hasChange = true
    } else if (JSON.stringify(unref(distributions)) !== JSON.stringify(unref(initDistributions))) {
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
    initDistributions.value = cloneDeep(unref(distributions))
  }

  const [register, tableMethods] = useTable({
    api: getPageData,
    canResize: props.canResize,
    columns: Columns,
    actionColumn: ActionConfig,
    showTableSetting: props.canResize,
    clickToRowSelect: false,
    pagination: false,
    // rowSelection: { type: 'checkbox' },
  })

  async function getPageData() {
    // console.log(distributions.value)
    return {
      items: distributions.value,
      total: distributions.value.length,
    }
  }

  function doDelete(_, index) {
    unref(distributions).splice(index, 1)
    tableMethods.reload()
  }

  function onDetailSubmit(data) {
    data.map((item: Recordable) => {
      const copyData = toRaw(item)
      if (!copyData.EntityId) {
        copyData.EntityId = props.entityId
      }
      if (!copyData.EntityTable) {
        copyData.EntityTable = props.entityTable
      }
      unref(distributions).push({
        Id: 0,
        EntityId: copyData.entityId,
        EntityTable: copyData.entityTable,
        DistributionMemberId: copyData.Id,
        TeacherId: copyData.TeacherId || 0,
        ThisYear: props.thisYear,
        Score: 0,
        Money: 0,
        Sort: unref(distributions).length + 1,
        SortStr: unref(distributions).length + 1,
        ChangeInfo: '',
        IsLocked: false,
        MemberInfo: copyData,
      })
    })
    tableMethods.reload()
  }

  function toCreate() {
    detailPayload.value = {}
  }

  function doSave() {
    initDistributions.value = null
    ;(props as any).saveApi(props.members, distributions.value)
  }

  function getTableData() {
    return {
      members: props.members,
      distributions: distributions.value,
    }
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
      if (key == 'Score') {
        const score = props.detail.Score
        const money = props.detail.Money
        setIndexData(list, index, 'Money', ((value * 1) / score * money).toFixed(2) * 1)
      }
    } catch (e) {
      // nothing
    }
  }
</script>

<style scoped></style>
