export type UserDTO = {
  userId: string;
  userNm: string;
  userEmail?: string;
  roleId?: number;
};

export type ApiResult = {
  success: boolean;
  message?: string;
};

export type LoginResult = ApiResult & {
  user?: UserDTO;
};
