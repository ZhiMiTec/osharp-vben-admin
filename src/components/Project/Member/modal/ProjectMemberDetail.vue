<template>
  <BasicModal
    title="成员信息"
    width="800px"
    :keyboard="false"
    @register="registerModal"
    @ok="doSubmit"
    :afterClose="() => $emit('close')"
  >
    <BasicForm @register="registerForm" />
  </BasicModal>
</template>

<script lang="ts" setup>
  import { onMounted, defineProps, ref, defineEmits, unref, toRaw, nextTick } from 'vue'
  import { BasicModal, useModal } from '/@/components/Modal'
  import { BasicForm, useForm } from '/@/components/Form'
  import { DetailFormConfig } from '../data/ProjectMemberTable'
  import { useMessage } from '../../../../hooks/web/useMessage'
  import { cloneDeep, set } from 'lodash-es'
  //
  const props = defineProps({
    payload: { type: Object, default: () => ({}) },
    entityTable: { type: String },
  })
  const emit = defineEmits(['close', 'submit'])

  const detail = ref<any>({
    Id: 0,
    SexId: '23',
    IsAuthor: false,
    IdCardTypeId: '361',
    KYA_PoliticsFaceId: '383',
    KYA_EducationId: '405',
    KYA_AcademicCodeId: '395',
  })

  const [registerModal, { openModal, closeModal }] = useModal()
  const [registerForm, formMethods] = useForm({
    ...(() => {
      let copyFormConf = cloneDeep(DetailFormConfig)
      if (props.entityTable != 'Thesis') {
        copyFormConf.schemas = copyFormConf.schemas?.filter((o) => o.field !== 'IsAuthor')
      } else {
      }
      if (['LongitudinalProject', 'InfeedProject'].indexOf(props.entityTable) >= 0) {
        // 横向纵向需要填写科研安的内容
        let KYAFields = [
          'KYA_PoliticsFaceId',
          'KYA_AcademicCodeId',
          'KYA_EducationId',
          'ResearchArea',
          'DegreeId',
          'OpenBank',
          'BankCode',
          'OwnCardPerson',
          'Phone',
        ]
        copyFormConf.schemas?.map((o: any) => {
          if (KYAFields.indexOf(o.field) >= 0) {
            set(o, 'ifShow', true)
          }
        })
      }
      return copyFormConf
    })(),
    model: {
      ...detail.value,
    },
  })
  const { createSuccessModal } = useMessage()

  onMounted(openModal)
  onMounted(async () => {
    await nextTick()
    detail.value = {
      ...detail.value,
      ...unref(props.payload),
    }
    formMethods.setFieldsValue(unref(detail))
  })

  async function doSubmit() {
    const values = await formMethods.validate()
    const submitData = {
      ...detail.value,
      ...values,
    }
    console.log(submitData, values)
    emit('submit', submitData)
    closeModal()
  }
</script>

<style lang="less" scoped></style>
