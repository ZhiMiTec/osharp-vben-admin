import type { UserInfo } from '/#/store';
import type { ErrorMessageMode } from '/#/axios';
import { defineStore } from 'pinia';
import { store } from '/@/store';
import { RoleEnum } from '/@/enums/roleEnum';
import { PageEnum } from '/@/enums/pageEnum';
import { ROLES_KEY, TOKEN_KEY, USER_INFO_KEY, USER_MODULE_KEY } from '/@/enums/cacheEnum';
import { getAuthCache, setAuthCache } from '/@/utils/auth';
import { GetUserInfoModel } from '/@/api/sys/model/userModel';
import { useI18n } from '/@/hooks/web/useI18n';
import { useMessage } from '/@/hooks/web/useMessage';
import { router } from '/@/router';
import { usePermissionStore } from '/@/store/modules/permission';
import { RouteRecordRaw } from 'vue-router';
import { PAGE_NOT_FOUND_ROUTE } from '/@/router/routes/basic';
import { isArray } from '/@/utils/is';
import { h } from 'vue';
import { findKey } from 'lodash-es';
import { Logout, Profile, Token } from '@/api/osharp/Identity';
import { IdentityTokenData } from '@/api/osharp/model/Identity';
import { GetAuthinfo } from '@/api/osharp/Auth';

interface UserState {
  userInfo: Nullable<UserInfo>;
  token?: string;
  roleList: RoleEnum[];
  sessionTimeout?: boolean;
  lastUpdateTime: number;
  modules: string[];
}

let refreshTokenHolder: Promise<any> | any;
export const useUserStore = defineStore({
  id: 'app-user',
  state: (): UserState => ({
    // user info
    userInfo: null,
    // token
    token: undefined,
    // roleList
    roleList: [],
    // user modules
    modules: [],
    // Whether the login expired
    sessionTimeout: false,
    // Last fetch time
    lastUpdateTime: 0,
  }),
  getters: {
    getUserInfo(state): UserInfo {
      return state.userInfo || getAuthCache<UserInfo>(USER_INFO_KEY) || {};
    },
    getToken(state): string {
      return state.token || getAuthCache<string>(TOKEN_KEY);
    },
    getRoleList(state): RoleEnum[] {
      return state.roleList.length > 0 ? state.roleList : getAuthCache<RoleEnum[]>(ROLES_KEY);
    },
    getModules(state): string[] {
      return state.modules.length > 0 ? state.modules : getAuthCache<string[]>(USER_MODULE_KEY);
    },
    getSessionTimeout(state): boolean {
      return !!state.sessionTimeout;
    },
    getLastUpdateTime(state): number {
      return state.lastUpdateTime;
    },
  },
  actions: {
    setToken(info: string | undefined) {
      this.token = info ? info : ''; // for null or undefined value
      setAuthCache(TOKEN_KEY, info);
    },
    setRoleList(roleList: RoleEnum[]) {
      this.roleList = roleList;
      setAuthCache(ROLES_KEY, roleList);
    },
    setModules(modules: string[]) {
      this.modules = modules;
      setAuthCache(USER_MODULE_KEY, modules);
    },
    setUserInfo(info: UserInfo) {
      if (info.CustomData && typeof info.CustomData == 'string') {
        try {
          info.CustomData = JSON.parse(info.CustomData);
        } catch (e) {
          console.log('格式化用户基本数据出错');
        }
      }
      this.userInfo = info;
      this.lastUpdateTime = new Date().getTime();
      setAuthCache(USER_INFO_KEY, info);
    },
    setSessionTimeout(flag: boolean) {
      this.sessionTimeout = flag;
    },
    resetState() {
      this.userInfo = null;
      this.token = '';
      this.roleList = [];
      this.modules = [];
      this.sessionTimeout = false;
    },
    /**
     * @description: login
     */
    async login(
      params: IdentityTokenData & {
        goHome?: boolean;
        mode?: ErrorMessageMode;
      },
    ): Promise<GetUserInfoModel | null> {
      try {
        const { goHome = true, mode, ...loginParams } = params;
        const data = await Token(loginParams, mode);
        let token;
        if (data.Data.AccessToken) {
          token = data.Data;
        } else {
          const tokenKey = findKey(data.Data, (o) => o.AccessToken);
          if (tokenKey) {
            token = data.Data[tokenKey];
          } else {
            return Promise.reject();
          }
        }

        // save token
        this.setToken(token);
        return this.afterLoginAction(goHome);
      } catch (error) {
        console.error(error);
        return Promise.reject(error);
      }
    },
    async afterLoginAction(goHome?: boolean): Promise<GetUserInfoModel | null> {
      if (!this.getToken) return null;
      // get user info
      const userInfo = await this.getUserInfoAction();
      await this.getUserModulesAction();

      const sessionTimeout = this.sessionTimeout;
      if (sessionTimeout) {
        this.setSessionTimeout(false);
      } else {
        const permissionStore = usePermissionStore();
        if (!permissionStore.isDynamicAddedRoute) {
          const routes = await permissionStore.buildRoutesAction();
          routes.forEach((route) => {
            router.addRoute(route as unknown as RouteRecordRaw);
          });
          router.addRoute(PAGE_NOT_FOUND_ROUTE as unknown as RouteRecordRaw);
          permissionStore.setDynamicAddedRoute(true);
        }
        goHome && (await router.replace(userInfo?.homePath || PageEnum.BASE_HOME));
      }
      return userInfo;
    },
    async getUserInfoAction(): Promise<UserInfo | null> {
      const { RefreshToken, AccessToken } = this.getToken as any;
      if (!RefreshToken || !AccessToken) {
        return {} as any;
      }
      try {
        const userInfo = await Profile();
        if (!userInfo) {
          return {} as any;
        }
        const { Roles = [] } = userInfo;
        if (isArray(Roles)) {
          // const roleList = roles.map((item) => item.value) as RoleEnum[]
          this.setRoleList(Roles);
        } else {
          userInfo.Roles = [];
          this.setRoleList([]);
        }
        userInfo.realName = userInfo.realName || userInfo.NickName || userInfo.UserName;
        this.setUserInfo(userInfo);
        return userInfo;
      } catch (e) {
        return {} as any;
      }
    },
    async getUserModulesAction(): Promise<string[]> {
      const userModules = await GetAuthinfo();
      this.setModules(userModules);
      return userModules;
    },
    async refreshUserToken(): Promise<any> {
      if (refreshTokenHolder) {
        await refreshTokenHolder;
        refreshTokenHolder = null;
        return;
      }
      refreshTokenHolder = new Promise(async (next: any) => {
        const { RefreshToken } = this.getToken as any;
        try {
          const { Data: newToken } = await Token({
            GrantType: 'refresh_token',
            RefreshToken: RefreshToken,
          });
          this.setToken(newToken);
          await this.afterLoginAction()
          next();
        } catch (e) {
          refreshTokenHolder = null;
          this.setToken(undefined);
          // this.logout()
        }
      });
      await refreshTokenHolder;
      refreshTokenHolder = null;
    },
    async isRefreshUserTokenNow() {
      return !!refreshTokenHolder;
    },
    clearRefreshUserTokenStatus() {
      refreshTokenHolder = null;
    },
    /**
     * @description: logout
     */
    async logout(goLogin = false) {
      if (this.getToken) {
        try {
          await Logout();
        } catch {
          console.log('注销Token失败');
        }
      }
      this.setToken(undefined);
      this.setRoleList([]);
      this.setModules([]);
      this.setSessionTimeout(false);
      // TODO 如果出现需要多站点后台管理的，并且token刷新过期的，请改为location.reload
      // goLogin && location.reload(true)
      goLogin && router.push(PageEnum.BASE_LOGIN);
    },

    /**
     * @description: Confirm before logging out
     */
    confirmLoginOut() {
      const { createConfirm } = useMessage();
      const { t } = useI18n();
      createConfirm({
        iconType: 'warning',
        title: () => h('span', t('sys.app.logoutTip')),
        content: () => h('span', t('sys.app.logoutMessage')),
        onOk: async () => {
          await this.logout(true);
        },
      });
    },
  },
});

// Need to be used outside the setup
export function useUserStoreWithOut() {
  return useUserStore(store);
}
