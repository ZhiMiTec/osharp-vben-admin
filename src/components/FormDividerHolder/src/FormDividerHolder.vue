<template>
  <Divider orientation="left">{{ text }}</Divider>
</template>
<script lang="ts" setup>
  import { Divider } from 'ant-design-vue'
  const props = defineProps({
    text: {},
  })
</script>

<style lang="less">
</style>
