<template>
  <div>
    <BasicTable @register="register">
      <template #toolbar>
        <Authority avalue="Module.ExportRoleModule">
          <a-button type="primary" @click="doExportRoleModule">备份授权</a-button>
        </Authority>
        <Authority avalue="Module.RestoreRoleModule">
          <a-button type="primary" @click="doRestoreRoleModule">还原授权</a-button>
        </Authority>
        <Authority value="Role.Create">
          <a-button type="primary" @click="toCreate">创建</a-button>
        </Authority>
      </template>
      <template #action="{ record }">
        <TableAction
          :actions="[
            {
              icon: 'clarity:note-edit-line',
              tooltip: '查看',
              auth: '.ole.ReadOne',
              onClick: toEdit.bind(null, record),
            },
            {
              icon: 'ant-design:delete-outlined',
              tooltip: '删除',
              color: 'error',
              auth: 'Role.Delete',
              popConfirm: {
                title: '是否确认删除',
                confirm: doDelete.bind(null, record),
              },
            },
            {
              icon: 'ant-design:code-sandbox-outlined',
              tooltip: '权限管理',
              auth: 'Role.SetModules',
              onClick: toModules.bind(null, record),
            },
            {
              icon: 'ant-design:solution-outlined',
              tooltip: '功能查看',
              auth: 'RoleFunction.ReadFunctions',
              onClick: toFunctions.bind(null, record),
            },
          ]"
        />
      </template>
    </BasicTable>
    <RoleDtl v-if="dtlPayload" :payload="dtlPayload" @close="onDtlModalClosed" />
    <RoleFunction
      v-if="functionsPayload"
      :payload="functionsPayload"
      @close="functionsPayload = false"
    />
    <RoleModule v-if="modulesPayload" :payload="modulesPayload" @close="modulesPayload = false" />
  </div>
</template>
<script lang="ts" setup>
  import { ref } from 'vue';
  import { BasicTable, TableAction, useTable } from '../../../components/Table';
  import { Delete, Read } from '../../../api/osharp/Role';
  import { FILE_ACCEPT_EXCEL, makeOSharpPage, useCustomUploader } from '../../../utils/osharp';
  import { Colums, FormConfig, ActionConfig, getFilterItems } from './data/role';
  import { OSharpPageOption } from '../../../utils/osharp/types/page';
  import { Authority } from '../../../components/Authority';
  import RoleDtl from './modal/roleDtl.vue';
  import RoleFunction from './modal/roleFunction.vue';
  import RoleModule from './modal/roleModule.vue';
  import { useLoading } from '../../../components/Loading';
  import { ExportRoleModule, RestoreRoleModule } from '../../../api/osharp/Module';
  import { downloadByUrl } from '../../../utils/file/download';
  import { UploadFiles } from '../../../api/admin/OSSUpload';

  const dtlPayload = ref(false);
  const modulesPayload = ref(false);
  const functionsPayload = ref(false);

  const [showLoading, hideLoading] = useLoading({});

  const [register, tableMethods] = useTable({
    api: getPageData,
    canResize: true,
    useSearchForm: true,
    columns: Colums,
    formConfig: FormConfig,
    actionColumn: ActionConfig,
  });

  async function getPageData({ page, pageSize }) {
    const searchForm = tableMethods.getForm().getFieldsValue();
    const body = makeOSharpPage({
      pageIndex: page,
      pageSize,
      filter: getFilterItems(searchForm),
    } as OSharpPageOption);
    let { Rows, Total, Data } = await Read(body);
    if (!Rows) {
      Rows = Data?.Rows as Array<any>;
      Total = Data?.Total as number;
    }
    return { items: Rows, total: Total };
  }

  function onDtlModalClosed() {
    tableMethods.reload();
    dtlPayload.value = false;
  }

  function toCreate() {
    dtlPayload.value = {} as any;
  }

  function toEdit(item) {
    dtlPayload.value = item;
  }

  async function doDelete(item) {
    await Delete([item.Id]);
    tableMethods.reload();
  }

  function toModules(item) {
    modulesPayload.value = item.Id;
  }

  function toFunctions(item) {
    functionsPayload.value = item.Id;
  }

  async function doExportRoleModule() {
    showLoading();
    try {
      const { Data } = await ExportRoleModule();
      downloadByUrl({ url: Data });
    } finally {
      hideLoading();
    }
  }

  async function doRestoreRoleModule() {
    let uploader = useCustomUploader({ accept: FILE_ACCEPT_EXCEL });
    uploader
      .once('select-file-success', async (file) => {
        showLoading();
        try {
          let { FilePath } = await UploadFiles(file);
          await RestoreRoleModule({ path: FilePath });
          tableMethods.reload();
        } finally {
          hideLoading();
        }
      })
      .selectFile();
  }
</script>
